import ws, {IUtf8Message} from "websocket"
import http, {Server} from "http"
import dotenv from "dotenv"
import {MessagePrefix, UserType} from "chat-common/src/model/types"
import {
    InboundAckMessage,
    InboundMesMessage,
    InboundMessageTemplate,
    OutboundMessageTemplate
} from "chat-common/src/message/types"
import {users} from "chat-common/src/model/constants"
import {getMessagePrefix} from "chat-common/src/message/functions"
import {isEmpty} from "utils/src/strings"
import {getParam} from "utils/src/urls"
import {initRedis, RedisAPIs, RedisMessageKey} from "./redis"
import {initHostConnection} from "./user_specific/host"
import {initGuessConnection} from "./user_specific/guess"

type AcceptConnectionReturn<A extends boolean> = A extends true ? [ws.connection, number] : void
export type AcceptConnection = <A extends boolean>(accept: A) => AcceptConnectionReturn<A>

export type CacheAndSendUntilAck = (key: RedisMessageKey, message: OutboundMessageTemplate) => void

export type HandleInboundMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => void
export type HandleInboundAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "ack">) => void
export type ApplyHandleInboundMessage = <UT extends UserType>(wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<UT>, handleAckMessage: HandleInboundAckMessage<UT>) => void

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
const initWebSocket = (httpServer: Server, {newUser, removeUser, getUsers, publishMessage, subscribeToMessages, removeMessage, isMessageAck, cacheMessage}: RedisAPIs) => {
    const wsServer = new ws.server({
        httpServer: httpServer,
        autoAcceptConnections: false
    })
    const originIsAllowed = (origin: string) => {
        return true
    }
    wsServer.on("request", async (request) => {
        const origin = request.origin
        if (!originIsAllowed(origin)) {
            request.reject()
            console.log(`connection from origin ${origin} rejected.`)
        } else {
            const userType = getUserType(request.httpRequest.url)

            let connection : ws.connection
            const acceptConnection = <A extends boolean>(accept: A) => {
                let tupleOrVoid
                if (accept) {
                    connection = request.accept(undefined, origin)
                    const connectionDate = Date.now()
                    console.log((connectionDate) + " connection accepted")
                    tupleOrVoid = [connection, connectionDate]
                } else {
                    tupleOrVoid = request.reject()
                }
                return tupleOrVoid as AcceptConnectionReturn<A>
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

            const applyHandleInboundMessage: ApplyHandleInboundMessage = (wsMessage: ws.Message, handleInboundMesMessage, handleInboundAckMessage) => {
                const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate
                const prefix = getMessagePrefix(message)
                switch (prefix) {
                    case "mes":
                        // @ts-ignore
                        handleInboundMesMessage(message as InboundMesMessage["template"])
                        break
                    case "ack":
                        // @ts-ignore
                        handleInboundAckMessage(message as InboundAckMessage["template"])
                        break
                }
                console.log((new Date()) + " inbound message from " + userType + ": " + message)
            }

            if (userType === users.host) {
                initHostConnection(acceptConnection, () => newUser("host"), () => removeUser(undefined), () => getUsers("guess"), publishMessage, subscribeToMessages, removeMessage, cacheAndSendUntilAck, applyHandleInboundMessage)
            } else {
                initGuessConnection(acceptConnection, () => newUser("guess"), (guessId) => removeUser(guessId), () => getUsers("host").then(s => s.length > 0), publishMessage, subscribeToMessages, removeMessage, cacheAndSendUntilAck, applyHandleInboundMessage)
            }
        }
    })
}

const init = async () => {
    const httpServer = initHttpServer()
    const redisAPIs = await initRedis()

    initWebSocket(httpServer, redisAPIs)
}

dotenv.config()
init().then().catch(e => console.log(`error: ${e}`))