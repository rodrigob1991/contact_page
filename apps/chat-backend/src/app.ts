import WebSocket, {RawData, WebSocketServer} from 'ws'
import {createServer, IncomingMessage} from "http"
import dotenv from "dotenv"
import {versions} from "utils/src/http/versions"
import {StatusCode} from "utils/src/http/response/statuses"
import {getResponseMessage} from "utils/src/http/response/message"
import {
    ConnectedUser,
    ConnectedUserData,
    MessagePrefix,
    MessagePrefixOut,
    OppositeUserType,
    UserType
} from "chat-common/src/model/types"
import {
    InboundAckMessage,
    InboundMesMessage,
    InboundMessageTarget,
    InboundMessageTemplate,
    OutboundConMessage,
    OutboundDisMessage,
    OutboundMesMessage,
    OutboundMessageTemplate,
    OutboundServerAckMessage,
    OutboundUserAckMessage,
    OutboundUsersMessage
} from "chat-common/src/message/types"
import {oppositeUserTypes, paths, userTypes} from "chat-common/src/model/constants"
import {getOriginPrefix, getPrefix} from "chat-common/src/message/functions"
import {
    AddConnectedUser,
    HandleOnError as HandleOnRedisError,
    HandleOnReady as HandleOnRedisReady,
    RedisClientAPIs,
    RedisMessageKey,
    initRedisConnection,
    errorCauses as redisErrorCauses
} from "./redis"
import {initConnection as initHostConnection} from "./user_types/host/initConnection"
import {initConnection as initGuessConnection} from "./user_types/guess/initConnection"
import {
    attemptConnection as attemptHostConnection,
    getResponseCookies as getHostResponseCookies
} from "./user_types/host/attemptConnection"
import {
    attemptConnection as attemptGuessConnection,
    getResponseCookies as getGuessResponseCookies
} from "./user_types/guess/attemptConnection"
import {Duplex} from "node:stream"
import {parseRequestCookies} from "utils/src/http/request/headers/cookies"
import {getResponseCookieHeaders, ResponseCookies} from "utils/src/http/response/headers/cookies"
import {AuthenticationError} from "./errors/authentication"
import {log, logError} from './logs'
import {AppError} from "./errors/app";
import {RedisError} from "./errors/redis";

type UpgradeToWebSocketConnection = (request: IncomingMessage, socket: Duplex, head: Buffer, user: ConnectedUser, cookies: ResponseCookies) => void

export type SetConnectionHandlers = (him: HandleInboundMessage , hd: HandleDisconnection) => void
export type CloseConnection = (reason?: string) => void

export type HandleDisconnection = (reasonCode: number, description: string) => void
export type HandleInboundMessage = (rawData: RawData) => void
export type HandleInboundMesMessage<UT extends UserType=UserType> = { [K in UT]: (m: InboundMessageTemplate<K, "mes">) => [OutboundServerAckMessage<K>["template"], number, RedisMessageKey<[InboundMessageTarget<InboundMesMessage<K>>]>, InboundMessageTarget<InboundMesMessage<K>>["template"], () => Promise<void>] }[UT]
//export type HandleInboundAckMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<UT, "uack">) => [OriginPrefix, RedisMessageKey<[OutboundMessage<UT>]>, number, RedisMessageKey<[OutboundUserAckMessage<TheOtherUserType<UT>>]> | undefined, OutboundUserAckMessage<TheOtherUserType<UT>>["template"] | undefined, (() => Promise<void>) | undefined]}[UT]
export type HandleInboundAckConMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "con">) => RedisMessageKey<[OutboundConMessage<K>]>}[UT]
export type HandleInboundAckDisMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "dis">) => RedisMessageKey<[OutboundDisMessage<K>]>}[UT]
export type HandleInboundAckUsrsMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "usrs">) => RedisMessageKey<[OutboundUsersMessage<K>]>}[UT]
export type HandleInboundAckUackMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "uack">) => RedisMessageKey<[OutboundUserAckMessage<K>]>}[UT]
export type HandleInboundAckMesMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "mes">) => [RedisMessageKey<[OutboundMesMessage<K>]>, number, RedisMessageKey<[OutboundUserAckMessage<OppositeUserType[K]>]>, OutboundUserAckMessage<OppositeUserType[K]>["template"], () => Promise<void>]}[UT]
export type ApplyHandleInboundMessage<UT extends UserType=UserType> =(rawData: RawData, handleMesMessage: HandleInboundMesMessage<UT>, handleAckConMessage: HandleInboundAckConMessage<UT>, handleAckDisMessage: HandleInboundAckDisMessage<UT>, handleAckUsrsMessage: HandleInboundAckUsrsMessage<UT>, handleAckUackMessage: HandleInboundAckUackMessage<UT>, handleAckMesMessage: HandleInboundAckMesMessage<UT>, userId: number) => void

export type SendMessage<UT extends UserType> = (cache: boolean, ...message: OutboundMessageTemplate<UT, Exclude<MessagePrefixOut, "sack">>[]) => Promise<void>

// THIS RETURN THE HANDLER FOR THE ERRORS LIKE THOSE THAT OCCURS IN CALLBACKS OF THE CONNECTIONS
// ONY USE IT WHEN THE ERROR DOES NOT NEED TO PROPAGATE
// COULD BE A CENTRALIZE PLACE TO HANDLE THOSE ERRORS, FIND OUT
export const getHandleError = (originFunction: Function, info?: string, callback?: (error: Error) => void) =>
    (error: Error) => {
        let userType, userId
        if (error instanceof AppError)
            ({userType, userId} = error)
        logError("from " + originFunction.name + ", " + (info !== undefined ? info + ", " : "") + error.message, userType, userId)
        if (callback)
            callback(error)
    }

const setResponseCookiesEventName = "setResponseCookies"

const originIsAllowed = (origin: string | undefined) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN
    return (allowedOrigin === undefined) || (origin !== undefined && origin.startsWith(allowedOrigin))
}
const handleUpgrade = async (request: IncomingMessage, socket: Duplex, head: Buffer, addConnectedUser: AddConnectedUser, upgradeToWebSocketConnection: UpgradeToWebSocketConnection) => {
    socket.on("error", getHandleError(handleUpgrade))
    console.log("HEADERS:" + JSON.stringify(request.headers))
    const {origin, cookie: rawRequestCookies} = request.headers
    if (originIsAllowed(origin)) {
        const userType = request.url === paths.host ? "host" : "guess"
        const requestCookies = rawRequestCookies !== undefined ? parseRequestCookies(rawRequestCookies) : []

        let connectedUserData
        let getResponseCookies
        if (userType === "host") {
            connectedUserData = await attemptHostConnection(requestCookies, (id) => addConnectedUser("host", id))
            getResponseCookies = getHostResponseCookies
        } else {
            connectedUserData = await attemptGuessConnection(requestCookies, (id) => addConnectedUser("guess", id))
            getResponseCookies = getGuessResponseCookies
        }
        upgradeToWebSocketConnection(request, socket, head, {type: userType, data: connectedUserData}, getResponseCookies(connectedUserData.id))
    }
}

const handleConnection = async ({type: userType, data: userData}: ConnectedUser, {removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck}: Pick<RedisClientAPIs, Exclude<keyof RedisClientAPIs, "addConnectedUser">>, connection: WebSocket) => {
    const oppositeUserType = oppositeUserTypes[userType]

    const setConnectionHandlers: SetConnectionHandlers = (him, hd) => {
        connection.on("message", him)
        connection.on("close", hd)
    }

    const cacheAndSendUntilAck = async (cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey, message: OutboundMessageTemplate, userId: number) => {
        const sendUntilAck = () => {
            if (connection.readyState === WebSocket.OPEN) {
                connection.send(message)
                log("sent outbound message " + message, userType, userId)
                setTimeout(() => {
                    // consider when the connection with redis fail
                    // to continue sending the message pass a callback to getHandleError that call sendUntilAck
                    isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                        if (!ack) {
                            sendUntilAck()
                        }
                    }).catch(getHandleError(sendUntilAck, undefined))
                }, 5000)
            }
        }
        return (cache ? cacheMessage(userType, userId, messagePrefix, key, message) : Promise.resolve()).then(sendUntilAck)
    }

    const applyHandleInboundMessage: ApplyHandleInboundMessage = (rawData, handleMesMessage, handleAckConMessage, handleAckDisMessage, handleAckUsrsMessage, handleAckUackMessage, handleAckMesMessage, userId) => {
        const handleError = getHandleError(applyHandleInboundMessage)

        const message = rawData.toString() as InboundMessageTemplate
        const prefix = getPrefix(message)
        switch (prefix) {
            case "mes": {
                const [outboundSackMessage, oppositeUserId, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message as InboundMesMessage["template"])
                publishOutboundMesMessage().catch(handleError)
                // only send outbound sack message when the outbound mes message is cache
                cacheMessage(oppositeUserType, oppositeUserId, "mes", outboundMesMessageKey, outboundMesMessage).then(() => { connection.send(outboundSackMessage) }).catch(handleError)
                break
            }
            case "uack": {
                const originPrefix= getOriginPrefix(message as InboundAckMessage["template"])

                const removeOriginMessage = (messageKey: RedisMessageKey) => { removeMessage(userType, userId, originPrefix, messageKey).catch(handleError) }

                switch (originPrefix) {
                    case "con":
                        const originConMessageKey = handleAckConMessage(message as InboundAckMessage<UserType,"con">["template"])
                        removeOriginMessage(originConMessageKey)
                        break
                    case "dis":
                        const originDisMessageKey = handleAckDisMessage(message as InboundAckMessage<UserType,"dis">["template"])
                        removeOriginMessage(originDisMessageKey)
                        break
                    case "usrs":
                        const originUsrsMessageKey = handleAckUsrsMessage(message as InboundAckMessage<UserType,"usrs">["template"])
                        removeOriginMessage(originUsrsMessageKey)
                        break
                    case "uack":
                        const originUackMessageKey = handleAckUackMessage(message as InboundAckMessage<UserType,"uack">["template"])
                        removeOriginMessage(originUackMessageKey)
                        break
                    case "mes":
                        const [originMesMessageKey, oppositeUserId, uackMessageKey, uackMessage, publishUackMessage] = handleAckMesMessage(message as InboundAckMessage<UserType,"mes">["template"])
                        /*this is when a user ack a mes message
                        I only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process*/
                        cacheMessage(oppositeUserType, oppositeUserId, "uack", uackMessageKey, uackMessage).then(() => { removeOriginMessage(originMesMessageKey) }).catch(handleError)
                        publishUackMessage().catch(handleError)
                        break
                }
            }
        }
        log("inbound message " + message, userType, userId)
    }

    await (() => (userType === userTypes.host
        ? initHostConnection(userData as ConnectedUserData<"host">, setConnectionHandlers,(hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp), (hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"host">)
        : initGuessConnection(userData, setConnectionHandlers,(guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId), (hostId, mp) => publishMessage("host", hostId, mp), (guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi, wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"guess">)))()
}

const initWebSocketServer = () => {
    const httpServer = createServer()
    const wsServer = new WebSocketServer({noServer: true})

    const handleOnRedisError: HandleOnRedisError = (error) => {}
    const handleOnRedisReady: HandleOnRedisReady = () => {}
    const {addConnectedUser, ...redisClientApisRest} = initRedisConnection(handleOnRedisError, handleOnRedisReady)

    const upgradeToWebSocketConnection: UpgradeToWebSocketConnection = (request, socket, head, user, cookies) => {
        request.once(setResponseCookiesEventName, (headers: string[]) => {
            headers.push(...getResponseCookieHeaders(...cookies))
        })
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit("connection", ws, user)
        })
    }

    httpServer.on("upgrade", (request, socket, head) => {
        handleUpgrade(request, socket, head, addConnectedUser, upgradeToWebSocketConnection).catch(getHandleError(handleUpgrade, undefined, (error) => {
            let statusCode: StatusCode = 500
            if (error instanceof AuthenticationError) {
                statusCode = 401
            } else if (error instanceof RedisError) {
                if (error.cause === redisErrorCauses.addConnectedUser.alreadyConnected)
                    statusCode = 400
            }
            socket.write(getResponseMessage(versions["1.1"], statusCode))
            socket.destroy()
        }))
    })

    wsServer.on("headers", (responseHeaders, request) => {
        request.emit(setResponseCookiesEventName, responseHeaders)
    })
    wsServer.on("connection", (connection: WebSocket, user: ConnectedUser) => {
        handleConnection(user, redisClientApisRest, connection).catch(getHandleError(handleConnection, undefined, (error) => {
            connection.terminate()
        }))
    })

    httpServer.listen(process.env.PORT, () => {
        log("http server listening on port " + process.env.PORT)
    })
}

dotenv.config()
initWebSocketServer()