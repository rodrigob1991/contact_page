import ws, {IUtf8Message} from "websocket"
import http, {IncomingMessage, Server, ServerResponse} from "http"
import dotenv from "dotenv"
import {MessagePrefix, MessagePrefixOut, TheOtherUserType, UserType} from "chat-common/src/model/types"
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
import {paths, users} from "chat-common/src/model/constants"
import {getOriginPrefix, getPrefix} from "chat-common/src/message/functions"
import {initRedis, RedisAPIs, RedisMessageKey} from "./redis"
import {decrypt, encrypt} from "utils/src/security"
import {initConnection as initHostConnection} from "./user_types/host/initConnection"
import {initConnection as initGuessConnection} from "./user_types/guess/initConnection"
import {isHostValidRegistered} from "./user_types/host/authentication"

type IfTrueT<B extends boolean, T, O=undefined> = B extends true ? T : O
export type AcceptConnection = <A extends boolean>(accept: A, him: IfTrueT<A, HandleInboundMessage> , hd: IfTrueT<A, HandleDisconnection>, reason: IfTrueT<A, undefined, string>, userId?: number) => void
export type CloseConnection = (reason?: string) => void

export type HandleDisconnection = (reasonCode: number, description: string) => void
export type HandleInboundMessage = (m: ws.Message) => void
export type HandleInboundMesMessage<UT extends UserType=UserType> = { [K in UT]: (m: InboundMessageTemplate<K, "mes">) => [OutboundServerAckMessage<K>["template"], number, RedisMessageKey<[InboundMessageTarget<InboundMesMessage<K>>]>, InboundMessageTarget<InboundMesMessage<K>>["template"], () => Promise<void>] }[UT]
//export type HandleInboundAckMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<UT, "uack">) => [OriginPrefix, RedisMessageKey<[OutboundMessage<UT>]>, number, RedisMessageKey<[OutboundUserAckMessage<TheOtherUserType<UT>>]> | undefined, OutboundUserAckMessage<TheOtherUserType<UT>>["template"] | undefined, (() => Promise<void>) | undefined]}[UT]
export type HandleInboundAckConMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "con">) => RedisMessageKey<[OutboundConMessage<K>]>}[UT]
export type HandleInboundAckDisMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "dis">) => RedisMessageKey<[OutboundDisMessage<K>]>}[UT]
export type HandleInboundAckUsrsMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "usrs">) => RedisMessageKey<[OutboundUsersMessage<K>]>}[UT]
export type HandleInboundAckUackMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "uack">) => RedisMessageKey<[OutboundUserAckMessage<K>]>}[UT]
export type HandleInboundAckMesMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<K, "uack", "mes">) => [RedisMessageKey<[OutboundMesMessage<K>]>, number, RedisMessageKey<[OutboundUserAckMessage<TheOtherUserType<K>>]>, OutboundUserAckMessage<TheOtherUserType<K>>["template"], () => Promise<void>]}[UT]
export type ApplyHandleInboundMessage<UT extends UserType=UserType> =(wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<UT>, handleAckConMessage: HandleInboundAckConMessage<UT>, handleAckDisMessage: HandleInboundAckDisMessage<UT>, handleAckUsrsMessage: HandleInboundAckUsrsMessage<UT>, handleAckUackMessage: HandleInboundAckUackMessage<UT>, handleAckMesMessage: HandleInboundAckMesMessage<UT>, userId: number) => void

export type SendMessage<UT extends UserType> = (cache: boolean, ...message: OutboundMessageTemplate<UT, Exclude<MessagePrefixOut, "sack">>[]) => Promise<void>

const getStandardMessage = (msg: string, userType?: UserType, userId?: number) =>
    (userType ? (userType + (userId === undefined ? "" : " " + userId)) + " : " : "") + msg + " : " + new Date().toString()

export const panic = (msg: string, userType?: UserType, userId?: number) => {
    throw new Error(getStandardMessage(msg, userType, userId))
}
export const log = (msg: string, userType?: UserType, userId?: number) => { console.log(getStandardMessage(msg, userType, userId)) }
export const logError = (msg: string, userType?: UserType, userId?: number) => { console.error(getStandardMessage(msg, userType, userId)) }

// THIS RETURN THE HANDLER FOR THE ERRORS LIKE THOSE THAT OCCURS IN CALLBACKS OF THE CONNECTIONS
// ONY USE IT WHEN THE ERROR DOES NOT NEED TO PROPAGATE
// COULD BE A CENTRALIZE PLACE TO HANDLE THOSE ERRORS, FIND OUT
export const getHandleError = (originFunction: (...args: any[]) => any, reason2?: string, userType?: UserType, userId?: number, callback?: (r: string) => void) =>
    (reason1: string) => {
        logError("error on: " + originFunction.name + ", " + (reason2 !== undefined ? reason2 + ", " : "") + reason1, userType, userId)
        if (callback)
            callback(reason1)
    }

const initHttpServer = () => {
    const httpServer = http.createServer((request: IncomingMessage, response: ServerResponse) => {
        response.writeHead(404)
        response.end()
    })
    httpServer.listen(process.env.PORT, () => {
        log("http server is listening on port " + process.env.PORT)
    })
    return httpServer
}

type Cookie = ws.ICookie
type CookiesIn = Cookie[]
type CookiesOut = (Cookie & { samesite: string })[]
const hostCookieNamePrefix = users.host
const guessCookieName = users.guess

const getCookiesValues = async (cookies: CookiesIn, forHost: boolean): Promise<[UserType, number | undefined]> => {
    let userType: UserType = users.guess
    let id

    const processHostCookie = async ({name, value}: ws.ICookie) => {
        let found = false
        if (name.startsWith(hostCookieNamePrefix)) {
            const hostId = +name.substring(hostCookieNamePrefix.length)
            if (!isNaN(hostId)) {
                found = true
                /* switch (hostId) {
                     case "1" :
                         if (!isEmpty(value) && value === process.env.HOST_1_TOKEN)
                             userType = "host"
                             id = parseInt(hostId)
                         break
                 }*/
                if (await isHostValidRegistered(hostId, value).catch((r: string) => panic(r, "host", hostId))) {
                    userType = "host"
                    id = hostId
                }
            }
        }
        return found
    }
    const processGuessCookie = async ({name, value}: ws.ICookie) => {
        let found = false
        if (name === guessCookieName) {
            found = true
            const decryptedId = decrypt(process.env.ENCRIPTION_SECRET_KEY as string, value)
            if (decryptedId.succeed) {
                userType = "guess"
                id = parseInt(decryptedId.output)
            }
        }
        return Promise.resolve(found)
    }

    const processCookie = forHost ? processHostCookie : processGuessCookie

    let index = 0
    while (index < cookies.length &&  !await processCookie(cookies[index])) {
        index++
    }
    return [userType, id]
}

const newGuessCookies = (guessId: number | undefined): CookiesOut => {
    const cookies: CookiesOut = []
    if (guessId !== undefined) {
        cookies.push({
            name: guessCookieName,
            value: encrypt(process.env.ENCRIPTION_SECRET_KEY as string, guessId.toString()),
            path: paths.guess,
            secure: true,
            samesite: "none",
            // roughly one year
            maxage: 60*60*24*30*12
        })
    }
    return cookies
}
const newHostCookies = (): CookiesOut => {
    return []
}
const originIsAllowed = (origin: string) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN
    return allowedOrigin !== undefined ? origin.startsWith(allowedOrigin) : true
}

const handleRequest = async (request: ws.request, {addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck}: RedisAPIs) => {
    const origin = request.origin
    if (!originIsAllowed(origin)) {
        request.reject()
        log(`connection from origin ${origin} rejected.`)
    } else {
        const [userType, cookieUserId] = await getCookiesValues(request.cookies, request.httpRequest.url === paths.host)
        const oppositeUserType = userType === "host" ? "guess" : "host"

        let connection : ws.connection
        const acceptConnection: AcceptConnection = (accept, him, hd, reason, userId) => {
            if (accept) {
                const cookies = userType === "host" ? newHostCookies() : newGuessCookies(userId)
                log("cookies: " + JSON.stringify(cookies), userType, userId)
                connection = request.accept(undefined, origin, cookies)
                connection.on("message", him as HandleInboundMessage)
                connection.on("close", hd as HandleDisconnection)
                log("connection accepted", userType, cookieUserId ?? userId)
            } else {
                request.reject(412, reason)
                log(" connection was rejected," + reason, userType,cookieUserId ?? userId)
            }
        }
        const closeConnection: CloseConnection = (reason) => {
            connection.close(ws.connection.CLOSE_REASON_GOING_AWAY, reason)
        }

        const cacheAndSendUntilAck = async (cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey, message: OutboundMessageTemplate, userId: number) => {
            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message)
                    log("sent outbound message " + message, userType, userId)
                    setTimeout(() => {
                        // consider when the connection with redis fail
                        // to continue sending the message pass a callback to getHandleError that call sendUntilAck
                        isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                            if (!ack) {
                                sendUntilAck()
                            }
                        }).catch(getHandleError(sendUntilAck, undefined, userType, userId))
                    }, 5000)
                }
            }
            return (cache ? cacheMessage(userType, userId, messagePrefix, key, message) : Promise.resolve()).then(sendUntilAck)
        }

        const applyHandleInboundMessage: ApplyHandleInboundMessage = (wsMessage, handleMesMessage, handleAckConMessage, handleAckDisMessage, handleAckUsrsMessage, handleAckUackMessage, handleAckMesMessage, userId) => {
            //const catchError = (reason: string) => {log("error handling inbound message, " + reason, userType, userId)}
            const handleError = getHandleError(applyHandleInboundMessage, undefined, userType, userId)

            const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
            const prefix = getPrefix(message)
            switch (prefix) {
                case "mes": {
                    const [outboundSackMessage, oppositeUserId, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message as InboundMesMessage["template"])
                    publishOutboundMesMessage().catch(handleError)
                    // only send outbound sack message when the outbound mes message is cache
                    cacheMessage(oppositeUserType, oppositeUserId, "mes", outboundMesMessageKey, outboundMesMessage).then(() => { connection.sendUTF(outboundSackMessage) }).catch(handleError)
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

                /*    const [originOutboundMessagePrefix, originOutboundMessageKey, oppositeUserId, outboundUackMessageKey, outboundUackMessage, publishOutboundUackMessage] = handleAckMessage(message as InboundAckMessage["template"])
                    const removeOriginMessage = () => removeMessage(userType, userId, originOutboundMessagePrefix, originOutboundMessageKey).catch(handleError)
                    if (outboundUackMessageKey) {
                        (publishOutboundUackMessage as () => Promise<void>)().catch(handleError)
                        // this is when a user ack a mes message
                        // I only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        // if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process
                        cacheMessage(oppositeUserType, oppositeUserId, "uack", outboundUackMessageKey, outboundUackMessage as OutboundUserAckMessage["template"]).then(removeOriginMessage)
                    } else {
                        // the user ack a con dis or uack message
                        removeOriginMessage()
                    }
                    break*/
                }
            }
            log("inbound message " + message, userType, userId)
        }

        await (() => (userType === users.host
            ? initHostConnection(acceptConnection, closeConnection, () => addConnectedUser("host", cookieUserId as number), (hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp), (hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"host">)
            : initGuessConnection(acceptConnection, closeConnection, () => addConnectedUser("guess", cookieUserId), (guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId), (hostId, mp) => publishMessage("host", hostId, mp), (guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi, wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"guess">)))()
    }
}

const initWebSocket = (httpServer: Server, redisApis: RedisAPIs) => {
    const wsServer = new ws.server({
        httpServer: httpServer,
        autoAcceptConnections: false,
    })

    wsServer.on("request", (request) => {
        handleRequest(request, redisApis).catch(getHandleError(handleRequest))
    })
}

dotenv.config()

initWebSocket(initHttpServer(), initRedis())