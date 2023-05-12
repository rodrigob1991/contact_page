import ws, {IUtf8Message} from "websocket"
import http, {Server} from "http"
import dotenv from "dotenv"
import {TheOtherUserType, UserType} from "chat-common/src/model/types"
import {
    GotAllMessageParts,
    InboundAckMessage,
    InboundMesMessage, InboundMessageTarget,
    InboundMessageTemplate,
    OutboundMesMessage,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundServerAckMessage, OutboundUserAckMessage
} from "chat-common/src/message/types"
import {paths, users} from "chat-common/src/model/constants"
import {getMessagePrefix} from "chat-common/src/message/functions"
import {isEmpty} from "utils/src/strings"
import {GuessIdToPublish, initRedis, RedisAPIs, RedisMessageKey} from "./redis"
import {initHostConnection} from "./user_specific/host"
import {initGuessConnection} from "./user_specific/guess"
import {ApplyHandleInboundMessage} from "./user_specific/types"

type IfTrueT<B extends boolean, T, O=undefined> = B extends true ? T : O
export type AcceptConnection = <A extends boolean>(accept: A, him: IfTrueT<A, HandleInboundMessage> , hd: IfTrueT<A, HandleDisconnection>, reason: IfTrueT<A, undefined, string>, guessId?: number) => void
export type CloseConnection = (reason?: string, guessId?: number) => void

export type HandleDisconnection = (reasonCode: number, description: string) => void
export type HandleInboundMessage = (m: ws.Message) => void
export type HandleInboundMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => [OutboundServerAckMessage<UT>["template"], RedisMessageKey<[InboundMessageTarget<InboundMesMessage<UT>>]>, InboundMessageTarget<InboundMesMessage<UT>>["template"], () => Promise<void>]
export type HandleInboundAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "uack">) => [RedisMessageKey<[OutboundMessage<UT>]>, RedisMessageKey<[OutboundUserAckMessage<TheOtherUserType<UT>>]> | undefined, OutboundUserAckMessage<TheOtherUserType<UT>>["template"] | undefined, (() => Promise<void>) | undefined]

export type SendMessage<UT extends UserType> = (cache: boolean, ...message: OutboundMessageTemplate<UT>[]) => Promise<void>

export const log = (msg: string, userType?: UserType, guessId?: number) => {console.log((userType ? (userType + (guessId === undefined ? "" : " " + guessId)) + " : " : "") + msg + " : " + new Date())}

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
const hostCookieName = "host"
const guessCookieName = "guess"

const getCookiesValues = (cookies: Cookies, forHost: boolean): [UserType, number | undefined] => {
    let userType: UserType = users.guess
    let guessId

    const cookieTargetName = forHost ? hostCookieName : guessCookieName
    const whenHostCookieNameMatch = (value: string) => {
        if (!isEmpty(value) && value === process.env.HOST_TOKEN)
            userType = users.host
    }
    const whenGuessCookieNameMatch = (value: string) => {
        guessId = parseInt(value)
    }
    const whenCookieNameMatch = forHost ? whenHostCookieNameMatch : whenGuessCookieNameMatch

    let index = 0
    let found = false
    while (!found && index < cookies.length) {
        const {name, value} = cookies[index]
        if (name === cookieTargetName) {
            whenCookieNameMatch(value)
            found = true
        }
        index++
    }
    return [userType, guessId]
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

const handleRequest = (request: ws.request, {newUser, removeUser, getUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMesMessages, removeMessage, isMessageAck}: RedisAPIs) => {
    const origin = request.origin
    if (!originIsAllowed(origin)) {
        request.reject()
        log(`connection from origin ${origin} rejected.`)
    } else {
        const [userType, cookieGuessId] = getCookiesValues(request.cookies, request.httpRequest.url === paths.host)

        let connection : ws.connection
        const acceptConnection: AcceptConnection = (accept, him, hd, reason, guessId) => {
            if (accept) {
                connection = request.accept(undefined, origin, userType === "host" ? newHostCookies() : newGuessCookies(guessId))
                connection.on("message", him as HandleInboundMessage)
                connection.on("close", hd as HandleDisconnection)
                log("connection accepted", userType, guessId)
            } else {
                request.reject(412, reason)
                log(" connection was rejected," + reason, userType, guessId)
            }
        }
        const closeConnection: CloseConnection = (reason, guessId) => {
            connection.close(ws.connection.CLOSE_REASON_GOING_AWAY, reason)
        }

        const cacheAndSendUntilAck = (cache: boolean, key: RedisMessageKey, message: OutboundMessageTemplate, guessId?: number) => {
            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message)
                    log("sent outbound message " + message, userType, guessId)
                    setTimeout(() => {
                        //CONSIDER IF THIS FAIL AND THE MESSAGE IS NOT RECEIVED
                        isMessageAck(key).then(ack => {
                            if (!ack) {
                                sendUntilAck()
                            }
                        })
                    }, 5000)
                }
            }
            return (cache ? cacheMessage(key, message) : Promise.resolve()).then(sendUntilAck)
        }

        const applyHandleInboundMessage = (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<UserType>, handleAckMessage: HandleInboundAckMessage<UserType>, guessId?: number) => {
            const catchError = (reason: string) => {log("error handling inbound message, " + reason, userType, guessId)}

            const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
            const prefix = getMessagePrefix(message)
            switch (prefix) {
                case "mes":
                    const [outboundSackMessage, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message as InboundMesMessage["template"])
                    publishOutboundMesMessage().catch(catchError)
                    // only send outbound sack message when the outbound mes message is cache
                    cacheMessage(outboundMesMessageKey, outboundMesMessage).then(() => connection.sendUTF(outboundSackMessage)).catch(catchError)
                    break
                case "uack":
                    const [outboundMessageKey, outboundUackMessageKey, outboundUackMessage, publishOutboundUackMessage] = handleAckMessage(message as InboundAckMessage["template"])
                    if (outboundUackMessageKey) {
                        (publishOutboundUackMessage as () => Promise<void>)().catch(catchError)
                        // this is when a user ack a mes message
                        // i only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        // if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process
                        cacheMessage(outboundUackMessageKey, outboundUackMessage as OutboundUserAckMessage["template"]).then(() => removeMessage(outboundMessageKey)).catch(catchError)
                    } else {
                        // the user ack a con dis or uack message
                        removeMessage(outboundMessageKey).catch(catchError)
                    }
                    break
            }
            log("inbound message " + message, userType, guessId)
        }

        if (userType === users.host) {
            initHostConnection(acceptConnection, closeConnection, () => newUser("host", undefined), () => removeUser(undefined), () => getUsers("guess"), (mp, toGuessId) => publishMessage(mp, "guess", toGuessId),(sm) => handleUserSubscriptionToMessages(sm, undefined), () => getCachedMesMessages(undefined) as Promise<OutboundMesMessage<"host">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"host">)
        } else {
            initGuessConnection(acceptConnection, closeConnection, () =>  newUser("guess", cookieGuessId), (guessId) => removeUser(guessId), (toGuessId) => getUsers("host", toGuessId).then(s => s.length > 0),<M extends OutboundMessage<"host">>(mp: GotAllMessageParts<M>) => publishMessage(mp,"host", undefined as GuessIdToPublish<M["userType"], M["prefix"]>),(sm, gi) => handleUserSubscriptionToMessages(sm, gi), (gi) => getCachedMesMessages(gi) as Promise<OutboundMesMessage<"guess">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"guess">)
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