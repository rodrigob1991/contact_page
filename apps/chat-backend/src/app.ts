import ws, {IUtf8Message} from "websocket"
import http, {Server} from "http"
import dotenv from "dotenv"
import {MessagePrefix, OriginPrefix, TheOtherUserType, UserType} from "chat-common/src/model/types"
import {
    InboundAckMessage,
    InboundMesMessage,
    InboundMessageTarget,
    InboundMessageTemplate,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundServerAckMessage,
    OutboundUserAckMessage
} from "chat-common/src/message/types"
import {paths, users} from "chat-common/src/model/constants"
import {getMessagePrefix} from "chat-common/src/message/functions"
import {isEmpty} from "utils/src/strings"
import {initRedis, RedisAPIs, RedisMessageKey} from "./redis"
import {initHostConnection} from "./user_specific/host"
import {initGuessConnection} from "./user_specific/guess"

type IfTrueT<B extends boolean, T, O=undefined> = B extends true ? T : O
export type AcceptConnection = <A extends boolean>(accept: A, him: IfTrueT<A, HandleInboundMessage> , hd: IfTrueT<A, HandleDisconnection>, reason: IfTrueT<A, undefined, string>, userId?: number) => void
export type CloseConnection = (reason?: string) => void

export type HandleDisconnection = (reasonCode: number, description: string) => void
export type HandleInboundMessage = (m: ws.Message) => void
export type HandleInboundMesMessage<UT extends UserType=UserType> = { [K in UT]: (m: InboundMessageTemplate<K, "mes">) => [OutboundServerAckMessage<UT>["template"], RedisMessageKey<[InboundMessageTarget<InboundMesMessage<UT>>]>, InboundMessageTarget<InboundMesMessage<UT>>["template"], () => Promise<void>] }[UT]
export type HandleInboundAckMessage<UT extends UserType=UserType> = { [K in UT]: (a: InboundMessageTemplate<UT, "uack">) => [OriginPrefix, RedisMessageKey<[OutboundMessage<UT>]>, RedisMessageKey<[OutboundUserAckMessage<TheOtherUserType<UT>>]> | undefined, OutboundUserAckMessage<TheOtherUserType<UT>>["template"] | undefined, (() => Promise<void>) | undefined]}[UT]

export type SendMessage<UT extends UserType> = (cache: boolean, ...message: OutboundMessageTemplate<UT>[]) => Promise<void>

export const log = (msg: string, userType?: UserType, id?: number) => {console.log((userType ? (userType + (id === undefined ? "" : " " + id)) + " : " : "") + msg + " : " + new Date())}

const initHttpServer = () => {
    const httpServer = http.createServer((request, response) => {
        response.writeHead(404)
        response.end()
    })
    httpServer.listen(process.env.PORT, () => {
        log("http server is listening on port " + process.env.PORT)
    })
    return httpServer
}

type Cookies = ws.ICookie[]
const hostCookieNamePrefix = users.host
const guessCookieName = users.guess

const getCookiesValues = (cookies: Cookies, forHost: boolean): [UserType, number | undefined] => {
    let userType: UserType = users.guess
    let id

    const processHostCookie = ({name, value}: ws.ICookie) => {
        let found = false
        if (name.startsWith(hostCookieNamePrefix)) {
            found = true
            const hostId = name.substring(hostCookieNamePrefix.length)
            switch (hostId) {
                case "1" :
                    if (!isEmpty(value) && value === process.env.HOST_1_TOKEN)
                        userType = "host"
                        id = parseInt(hostId)
                    break
            }
        }
        return found
    }
    const processGuessCookie = ({name, value}: ws.ICookie) => {
        let found = false
        if (name === guessCookieName) {
            found = true
            userType = "guess"
            id = parseInt(value)
        }
        return found
    }

    const processCookie = forHost ? processHostCookie : processGuessCookie

    let index = 0
    while (index < cookies.length && !processCookie(cookies[index])) {
        index++
    }
    return [userType, id]
}

const newGuessCookies = (guessId: number | undefined): Cookies => {
    const cookies = []
    if (guessId !== undefined) {
        cookies.push({name: guessCookieName, value: "" + guessId, path: paths.guess})
    }
    return cookies
}
const newHostCookies = (): Cookies => {
    return []
}
const originIsAllowed = (origin: string) => {
    return true
}

const handleRequest = (request: ws.request, {addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck}: RedisAPIs) => {
    const origin = request.origin
    if (!originIsAllowed(origin)) {
        request.reject()
        log(`connection from origin ${origin} rejected.`)
    } else {
        const [userType, cookieUserId] = getCookiesValues(request.cookies, request.httpRequest.url === paths.host)

        let connection : ws.connection
        const acceptConnection: AcceptConnection = (accept, him, hd, reason, userId) => {
            if (accept) {
                connection = request.accept(undefined, origin, userType === "host" ? newHostCookies() : newGuessCookies(userId))
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

        const cacheAndSendUntilAck = (cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey, message: OutboundMessageTemplate, userId: number) => {
            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message)
                    log("sent outbound message " + message, userType, userId)
                    setTimeout(() => {
                        //CONSIDER IF THIS FAIL AND THE MESSAGE IS NOT RECEIVED
                        isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                            if (!ack) {
                                sendUntilAck()
                            }
                        })
                    }, 5000)
                }
            }
            return (cache ? cacheMessage(userType, userId, messagePrefix, key, message) : Promise.resolve()).then(sendUntilAck)
        }

        const applyHandleInboundMessage = (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage, handleAckMessage: HandleInboundAckMessage, userId: number) => {
            const catchError = (reason: string) => {log("error handling inbound message, " + reason, userType, userId)}

            const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
            const prefix = getMessagePrefix(message)
            switch (prefix) {
                case "mes":
                    const [outboundSackMessage, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message as InboundMesMessage["template"])
                    publishOutboundMesMessage().catch(catchError)
                    // only send outbound sack message when the outbound mes message is cache
                    cacheMessage(userType, userId, "mes", outboundMesMessageKey, outboundMesMessage).then(() => connection.sendUTF(outboundSackMessage)).catch(catchError)
                    break
                case "uack":
                    const [originOutboundMessagePrefix, originOutboundMessageKey, outboundUackMessageKey, outboundUackMessage, publishOutboundUackMessage] = handleAckMessage(message as InboundAckMessage["template"])
                    const removeOriginMessage = () => removeMessage(userType, userId, originOutboundMessagePrefix, originOutboundMessageKey).catch(catchError)
                    if (outboundUackMessageKey) {
                        (publishOutboundUackMessage as () => Promise<void>)().catch(catchError)
                        // this is when a user ack a mes message
                        // i only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        // if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process
                        cacheMessage(userType, userId, "uack", outboundUackMessageKey, outboundUackMessage as OutboundUserAckMessage["template"]).then(removeOriginMessage)
                    } else {
                        // the user ack a con dis or uack message
                        removeOriginMessage()
                    }
                    break
            }
            log("inbound message " + message, userType, userId)
        }

        if (userType === users.host) {
            initHostConnection(acceptConnection, closeConnection, () => addConnectedUser("host", cookieUserId as number), (hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp),(hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, (wsm,himm,hiam) => { applyHandleInboundMessage(wsm, himm, hiam, cookieUserId as number)})
        } else {
            initGuessConnection(acceptConnection, closeConnection, () =>  addConnectedUser("guess", cookieUserId), (guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId),(hostId,mp) => publishMessage("host", hostId, mp),(guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi,wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage)
        }
    }
}

const initWebSocket = (httpServer: Server, redisApis: RedisAPIs) => {
    const wsServer = new ws.server({
        httpServer: httpServer,
        autoAcceptConnections: false
    })

    wsServer.on("request", (r) => { handleRequest(r, redisApis) })
}

dotenv.config()

initWebSocket(initHttpServer(), initRedis())