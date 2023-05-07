import ws, {IUtf8Message} from "websocket"
import http, {Server} from "http"
import dotenv from "dotenv"
import {MessagePrefix, UserType} from "chat-common/src/model/types"
import {
    GotAllMessageParts,
    InboundAckMessage,
    InboundMesMessage,
    InboundMessageTemplate,
    OutboundMesMessage,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundServerAckMessage
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
export type HandleInboundMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => OutboundServerAckMessage<UT>["template"]
export type HandleInboundAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "uack">) => RedisMessageKey<[OutboundMessage<UT>]>

export type SendMessage<UT extends UserType> = <MP extends MessagePrefix>(...message: OutboundMessageTemplate<UT, MP>[]) => void

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

const handleRequest = (request: ws.request, {newUser, removeUser, getUsers, publishMessage, subscribeUserToMessages, unsubscribeToMessages, cacheMessage, getCachedMesMessages, removeMessage, isMessageAck}: RedisAPIs) => {
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
                connection.on("close", (reasonCode, description) => {
                    (hd as HandleDisconnection)(reasonCode,description)
                    unsubscribeToMessages()
                })
                log("connection accepted", userType, guessId)
            } else {
                request.reject(412, reason)
                log(" connection was rejected," + reason, userType, guessId)
            }
        }
        const closeConnection: CloseConnection = (reason, guessId) => {
            connection.close(500, reason)
            log(" connection was closed," + reason, userType, guessId)
        }

        const cacheAndSendUntilAck = (key: RedisMessageKey, message: OutboundMessageTemplate, guessId?: number) => {
            cacheMessage(key, message)

            const sendUntilAck = () => {
                if (connection?.connected) {
                    connection.sendUTF(message)
                    log("sent outbound message " + message, userType, guessId)
                    setTimeout(() => {
                        isMessageAck(key).then(is => {
                            if (!is) {
                                sendUntilAck()
                            }
                        })
                    }, 5000)
                }
            }
            sendUntilAck()
        }

        const applyHandleInboundMessage = (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<UserType>, handleAckMessage: HandleInboundAckMessage<UserType>, guessId?: number) => {
            const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
            const prefix = getMessagePrefix(message)
            switch (prefix) {
                case "mes":
                    const ackMessage = handleMesMessage(message as InboundMesMessage["template"])
                    connection.sendUTF(ackMessage)
                    break
                case "uack":
                    const messageKey = handleAckMessage(message as InboundAckMessage["template"])
                    removeMessage(messageKey)
                    break
            }
            log("inbound message " + message, userType, guessId)
        }

        if (userType === users.host) {
            initHostConnection(acceptConnection, closeConnection, () => newUser("host", undefined), () => removeUser(undefined), () => getUsers("guess"), (mp, toGuessId) => publishMessage(mp, "guess", toGuessId),(sm) => subscribeUserToMessages(sm, "host", undefined), () => getCachedMesMessages(undefined) as Promise<OutboundMesMessage<"host">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"host">)
        } else {
            initGuessConnection(acceptConnection, closeConnection, () =>  newUser("guess", cookieGuessId), (guessId) => removeUser(guessId), () => getUsers("host").then(s => s.length > 0),<M extends OutboundMessage<"host">>(mp: GotAllMessageParts<M>) => publishMessage(mp,"host", undefined as GuessIdToPublish<M["userType"], M["prefix"]>),(sm, gi) => subscribeUserToMessages(sm, "guess", gi), (gi) => getCachedMesMessages(gi) as Promise<OutboundMesMessage<"guess">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"guess">)
        }
    }
}

const initWebSocket = (httpServer: Server, redisApis: RedisAPIs) => {
    const wsServer = new ws.server({
        httpServer: httpServer,
        autoAcceptConnections: false
    })

    wsServer.on("request", (r) => {handleRequest(r, redisApis)})
}

dotenv.config()

initWebSocket(initHttpServer(), initRedis())