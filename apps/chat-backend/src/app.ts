import ws, {IUtf8Message} from "websocket"
import http, {Server} from "http"
import dotenv from "dotenv"
import {MessagePrefix, UserType} from "chat-common/src/model/types"
import {
    GotAllMessageParts,
    InboundAckMessage,
    InboundMesMessage,
    InboundMessageTemplate, OutboundMesMessage,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundServerAckMessage
} from "chat-common/src/message/types"
import {users} from "chat-common/src/model/constants"
import {getMessagePrefix} from "chat-common/src/message/functions"
import {isEmpty} from "utils/src/strings"
import {getParam} from "utils/src/urls"
import {GuessIdToPublish, initRedis, RedisAPIs, RedisMessageKey} from "./redis"
import {initHostConnection} from "./user_specific/host"
import {initGuessConnection} from "./user_specific/guess"

type IfTrueT<B extends boolean, T> = B extends true ? T : undefined
export type AcceptConnection = <A extends boolean>(him: IfTrueT<A, HandleInboundMessage> , hd: IfTrueT<A, HandleDisconnection>, accept: A, gi?: IfTrueT<A, number>) => number

export type CacheAndSendUntilAck = <M extends OutboundMessage[]>(key: RedisMessageKey<M>, message: M[number]["template"]) => void

export type HandleDisconnection = (reasonCode: number, description: string) => void
export type HandleInboundMessage = (m: ws.Message) => void
export type HandleInboundMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => OutboundServerAckMessage<UT>["template"]
export type HandleInboundAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "uack">) => RedisMessageKey<[OutboundMessage<UT>]>
export type ApplyHandleInboundMessage<UT extends UserType=UserType> = (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<UT>, handleAckMessage: HandleInboundAckMessage<UT>) => void

export type SendMessage<UT extends UserType> = <MP extends MessagePrefix>(...message: OutboundMessageTemplate<UT, MP>[]) => void

const initHttpServer = () => {
    const httpServer = http.createServer((request, response) => {
        console.log((new Date()) + ' Received request for ' + request.url)
        response.writeHead(404)
        response.end()
    })
    httpServer.listen(process.env.PORT, () => {
        console.log((new Date()) + 'http server is listening')
    })

    return httpServer
}
const getUserType = (url: string | undefined) => {
    const hostToken =  url ? getParam(url, "host_token") : ""
    const userType: UserType = !isEmpty(hostToken) && hostToken === process.env.HOST_TOKEN ? users.host : users.guess
    return userType
}
type Cookies = ws.ICookie[]
const hostTokenCookieName = "host"
const guessIdCookieName = "guess"

const getCookiesValues = (cookies: Cookies): [UserType, number | undefined] => {
    let userType: UserType = users.guess
    let guessId
    for (const cookie of cookies) {
        switch (cookie.name) {
            case hostTokenCookieName:
                const hostToken = cookie.value
                if (!isEmpty(hostToken) && hostToken === process.env.HOST_TOKEN)
                    userType = users.host
                break
            case guessIdCookieName:
                guessId = parseInt(cookie.value)
                break
        }
    }
    return [userType, guessId]
}

const getGuessCookies = (guessId: number | undefined): Cookies => {
    const cookies = []
    if (guessId !== undefined) {
        cookies.push({name: guessIdCookieName, value: "" + guessId})
    }
    return cookies
}
const getHostCookies = (): Cookies => {
    return []
}
const originIsAllowed = (origin: string) => {
    return true
}

const handleRequest = (request: ws.request, {newUser, removeUser, getUsers, publishMessage, subscribeUserToMessages, unsubscribeToMessages, cacheMessage, getCachedMesMessages, removeMessage, isMessageAck}: RedisAPIs) => {
    const origin = request.origin
    if (!originIsAllowed(origin)) {
        request.reject()
        console.log(`connection from origin ${origin} rejected.`)
    } else {
        const [userType, guessId] = getCookiesValues(request.cookies)

        let connection : ws.connection
        const acceptConnection: AcceptConnection = (him, hd, accept, gi) => {
            let connectionDate = 0
            if (accept) {
                connection = request.accept(undefined, origin, userType === "host" ? getHostCookies() : getGuessCookies(gi))
                connection.on("message", him as HandleInboundMessage)
                connection.on("close", (reasonCode, description) => {
                    (hd as HandleDisconnection)(reasonCode,description)
                    unsubscribeToMessages()
                })
                connectionDate = Date.now()
                console.log((connectionDate) + " connection accepted")
            } else {
                request.reject()
            }
            return connectionDate
        }

        const cacheAndSendUntilAck: CacheAndSendUntilAck = (key, message) => {
            cacheMessage(key, message)

            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message)
                    console.log("sent outbound message to " + userType + ": " + message)
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

        const applyHandleInboundMessage: ApplyHandleInboundMessage = (wsMessage, handleInboundMesMessage, handleInboundAckMessage) => {
            const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
            const prefix = getMessagePrefix(message)
            switch (prefix) {
                case "mes":
                    const ackMessage = handleInboundMesMessage(message as InboundMesMessage["template"])
                    connection.sendUTF(ackMessage)
                    break
                case "uack":
                    const messageKey = handleInboundAckMessage(message as InboundAckMessage["template"])
                    removeMessage(messageKey)
                    break
            }
            console.log((new Date()) + " inbound message from " + userType + ": " + message)
        }

        if (userType === users.host) {
            initHostConnection(acceptConnection, () => newUser("host"), () => removeUser(undefined), () => getUsers("guess"), (mp, toGuessId) => publishMessage(mp, "guess", toGuessId),(sm) => subscribeUserToMessages(sm, "host", undefined), () => getCachedMesMessages(undefined) as Promise<OutboundMesMessage<"host">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"host">)
        } else {
            initGuessConnection(acceptConnection, () => guessId ? Promise.resolve(guessId) : newUser("guess"), (guessId) => removeUser(guessId), () => getUsers("host").then(s => s.length > 0),<M extends OutboundMessage<"host">>(mp: GotAllMessageParts<M>) => publishMessage(mp,"host", undefined as GuessIdToPublish<M["userType"], M["prefix"]>),(sm, gi) => subscribeUserToMessages(sm, "guess", gi), (gi) => getCachedMesMessages(gi) as Promise<OutboundMesMessage<"guess">["template"][]>, cacheAndSendUntilAck, applyHandleInboundMessage as ApplyHandleInboundMessage<"guess">)
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