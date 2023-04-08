import ws, {IUtf8Message} from "websocket"
import {createClient} from 'redis'
import http from "http"
import dotenv from "dotenv"
import {MessageParts, MessagePrefix, UserType} from "chat-common/src/model/types"
import {
    CutMessage,
    GotAllMessageParts,
    GetMessages,
    InboundAckMessage,
    InboundAckMessageOrigin,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage,
    InboundFromHostAckMessage,
    InboundFromHostMesMessage,
    InboundMesMessage,
    InboundMessage,
    InboundMessageTarget,
    InboundMessageTemplate,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessAckMessage,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToHostAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage
} from "chat-common/src/message/types"
import {messagePrefixes, users} from "chat-common/src/model/constants"
import {getCutMessage, getMessage, getMessageParts} from "chat-common/src/message/functions"
import {isEmpty} from "utils/src/strings"
import {getParam} from "utils/src/urls"

type HandleMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => void
type HandleAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "ack">) => void

type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}${OM["userType"] extends "guess" ? `:${MessageParts["guessId"]}` : ""}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never

type SendMessage<UT extends UserType> = (...message: OutboundMessageTemplate<UT>[]) => void
type GuessIdToSubscribe<UT extends UserType> = ("guess" extends UT ? MessageParts["guessId"] : never) | ("host" extends UT ? undefined : never)
type SubscribeToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => void
type GuessIdToPublish<UT extends UserType, MP extends MessagePrefix> = UT extends "guess" ? MP extends "mes" | "ack" ? MessageParts["guessId"] : undefined : undefined
// only for one message type, no unions.
type PublishMessage = <M extends OutboundMessage>(messageParts: GotAllMessageParts<M>, toUserType: M["userType"], toGuessId: GuessIdToPublish<M["userType"], M["prefix"]>) => void
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => void
type RemoveMessage = <M extends OutboundMessage[]>(key: RedisMessageKey<M>) => void
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type NewUser = (userType: UserType) => Promise<number | void>
type RemoveUser = (guessId: number | undefined) => void
type GetUsers = (userType: UserType) => Promise<number[]>

const initRedisConnection = async () => {
    const client = createClient({url: process.env.URL, username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD})
    client.on('error', (err) => { console.error(err) })
    client.on('connect', () => { console.log('connected with redis') })
    client.on('reconnecting', () => { console.log('reconnecting with redis') })
    client.on('ready', () => { console.log('redis is ready') })

    try {
        await client.connect()
    } catch (e) {
        console.log(`could not connect with redis:${e}`)
    }
    return client
}
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
const initWebSocket = (subscribeToMessages : SubscribeToMessages, publishMessage: PublishMessage, cacheMessage: CacheMessage, removeMessage: RemoveMessage, isMessageAck: IsMessageAck, newUser: NewUser, removeUser: RemoveUser, getUsers: GetUsers) => {
    const wsServer = new ws.server({
        httpServer: initHttpServer(),
        autoAcceptConnections: false
    })

    const originIsAllowed = (origin: string) => {
        return true
    }
    wsServer.on("request", async (request) => {
        const origin = request.origin
        const connectionDate = Date.now()
        if (!originIsAllowed(origin)) {
            request.reject()
            console.log(`${connectionDate} connection from origin ${origin} rejected.`)
        } else {
            const connection = request.accept(undefined, origin)
            console.log((connectionDate) + " connection accepted")

            const url = request.httpRequest.url
            const hostToken =  url ? getParam(url, "host_token") : ""
            const userType: UserType = !isEmpty(hostToken) && hostToken === process.env.HOST_TOKEN ? users.host : users.guess
            const guessId = await newUser(userType)

            const sendMessage = (key: RedisMessageKey, message: OutboundMessageTemplate) => {
                cacheMessage(key, message)

                const resendUntilAck = () => {
                    if (connection.connected) {
                        console.log("outbound message to " + userType + ": " + message)
                        connection.sendUTF(message)
                        setTimeout(() => {
                            isMessageAck(key).then(is => {
                                if (!is) {
                                    resendUntilAck()
                                }
                            })
                        }, 5000)
                    }
                }
                resendUntilAck()
            }
            const sendMessageToHost: SendMessage<"host"> = (...messages) => {
                for (const message of messages) {
                    let key: RedisMessageKey<GetMessages<"host", "out">>
                    const mp = getMessageParts<OutboundMessage<"host">, "prefix">(message, {prefix: 1}).prefix
                    switch (mp) {
                        case "con":
                        case "dis":
                        case "ack":
                            key = `host:${message as OutboundMessageTemplate<"host", "con" | "dis" | "ack">}`
                            break
                        case "mes":
                            key = `host:${getCutMessage<OutboundMessage<"host", "mes">, "body">(message as OutboundMessageTemplate<"host", "mes">, {body: 4}, 4)}`
                            break
                        default:
                            throw new Error("invalid message prefix")
                    }
                    sendMessage(key, message)
                }
            }
            const sendMessageToGuess: SendMessage<"guess"> = (...messages) => {
                for (const message of messages) {
                    let key: RedisMessageKey<GetMessages<"guess", "out">>
                    const mp = getMessageParts<OutboundMessage<"guess">, "prefix">(message, {prefix: 1}).prefix
                    switch (mp) {
                        case "con":
                        case "dis":
                        case "ack":
                            key = `guess:${guessId as number}:${message as OutboundMessageTemplate<"guess", "con" | "dis" | "ack">}`
                            break
                        case "mes":
                            key = `guess:${guessId as number}:${getCutMessage<OutboundMessage<"guess", "mes">, "body">(message as OutboundMessageTemplate<"guess", "mes">, {body: 3}, 3)}`
                            break
                        default:
                            throw new Error("invalid message prefix")
                    }
                    sendMessage(key, message)
                }
            }

            const handleMessage = <UT extends UserType>(wsMessage: ws.Message, handleMesMessage: HandleMesMessage<UT>, handleAckMessage: HandleAckMessage<UT>) => {
                const message = (wsMessage as IUtf8Message).utf8Data as InboundMessageTemplate<UT>
                const {prefix} = getMessageParts<InboundMessage, "prefix">(message, {prefix: 1})
                switch (prefix) {
                    case "mes":
                        // @ts-ignore: typescript does not realize that UT is the same type parameter in the function type and in the message
                        handleMesMessage(message as InboundMesMessage<UT>["template"])
                        break
                    case "ack":
                        // @ts-ignore: typescript does not realize that UT is the same type parameter in the function type and in the message
                        handleAckMessage(message as InboundAckMessage<UT>["template"])
                        break
                }
                console.log((new Date()) + " inbound message from " + userType + ": " + message)
            }
            const handleMessageFromHost = (m: ws.Message) => {
                const handleMesMessage: HandleMesMessage<"host"> = (m) => {
                    const {number, guessId: toGuessId, body} = getMessageParts<InboundFromHostMesMessage, "number" | "guessId" | "body">(m, {number: 2, guessId: 3, body: 4})
                    publishMessage<InboundMessageTarget<InboundFromHostMesMessage>>({prefix: "mes", number: number, body: body}, "guess", toGuessId)
                }
                const handleAckMessage: HandleAckMessage<"host"> = (a) => {
                    const {originPrefix, number, guessId: fromGuessId} = getMessageParts<InboundFromHostAckMessage, "number" | "guessId" | "originPrefix">(a, {originPrefix: 2, number: 3, guessId: 4})
                    if (originPrefix === messagePrefixes.mes) {
                        publishMessage<OutboundToGuessAckMessage>({prefix: "ack", number: number}, "guess", fromGuessId)
                    }
                    removeMessage<InboundAckMessageOrigin<"host">>(`host:${originPrefix}:${number}:${fromGuessId}`)
                }
                handleMessage<"host">(m, handleMesMessage, handleAckMessage)
            }
            const handleMessageFromGuess = (m: ws.Message) => {
                const handleMesMessage: HandleMesMessage<"guess"> = (m) => {
                    const {number, body} = getMessageParts<InboundFromGuessMesMessage, "number" | "body">(m, {number: 2, body: 3})
                    publishMessage<InboundMessageTarget<InboundFromGuessMesMessage>>({prefix: "mes", number: number, guessId: guessId as number, body: body}, "host", undefined)
                }
                const handleAckMessage: HandleAckMessage<"guess"> = (a) => {
                    const {originPrefix, number} = getMessageParts<InboundFromGuessAckMessage, "originPrefix" | "number">(a, {originPrefix: 2, number: 3})
                    removeMessage<InboundAckMessageOrigin<"guess">>(`guess:${guessId as number}:${originPrefix}:${number}`)
                    if (originPrefix === messagePrefixes.mes)
                        publishMessage<OutboundToHostAckMessage>({prefix: "ack", number: number, guessId: guessId as number}, "host", undefined)
                }
                handleMessage(m, handleMesMessage, handleAckMessage)
            }

            const handleHostDisconnection = (reasonCode: number, description: string) => {
                console.log(`host disconnected, reason code:${reasonCode}, description: ${description}`)
                publishMessage<OutboundToGuessDisMessage>({prefix: "dis", number: Date.now()}, "guess", undefined)
                removeUser(undefined)
            }
            const handleGuessDisconnection = (reasonCode: number, description: string) => {
                console.log(`guess ${guessId} disconnected, reason code:${reasonCode}, description: ${description}`)
                publishMessage<OutboundToHostDisMessage>({prefix: "dis", number: Date.now(), guessId: guessId as number}, "host", undefined)
                removeUser(guessId as number)
            }

            if (userType === users.host) {
                subscribeToMessages(sendMessageToHost, "host", undefined)
                publishMessage<OutboundToGuessConMessage>({number: Date.now(), prefix: "con"}, "guess", undefined)
                connection.on("message", handleMessageFromHost)
                connection.on("close", handleHostDisconnection)
                getUsers(users.guess).then(guessesIds => sendMessageToHost(...guessesIds.map(guessId => getMessage<OutboundToHostConMessage>({prefix: "con", number: connectionDate, guessId: guessId}))))
            } else {
                subscribeToMessages(sendMessageToGuess, "guess", guessId as number)
                publishMessage<OutboundToHostConMessage>({number: Date.now(), prefix:"con", guessId: guessId as number}, "host", undefined)
                connection.on("message", handleMessageFromGuess)
                connection.on("close", handleGuessDisconnection)
                getUsers(users.host).then(hostId => { if(hostId.length > 0) sendMessageToGuess(getMessage<OutboundToGuessConMessage>({prefix: "con", number: connectionDate})) })
            }
        }
    })
}

const init = async () => {
    const redisClient = await initRedisConnection()

    const storageHostMemberId = "1"

    const getConDisChannel = (isHostUser: boolean) => messagePrefixes.con + "-" + messagePrefixes.dis + "-" + (isHostUser ? users.host : users.guess)
    const getMessagesChannel = (isHostUser: boolean, guessId?: number) => messagePrefixes.mes + "-" + (isHostUser ? users.host : users.guess + "-" + guessId)

    const subscribeToMessages: SubscribeToMessages = async (sendMessage, ofUserType, guessId) => {
        const subscriber = redisClient.duplicate()
        await subscriber.connect()

        const isHostUser = ofUserType === users.host

        await subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
            // @ts-ignore
            sendMessage(message as OutboundMessageTemplate<typeof ofUserType, "con" | "dis">)
        })
        await subscriber.subscribe(getMessagesChannel(isHostUser, guessId), (message, channel) => {
            // @ts-ignore
            sendMessage(message as OutboundMessageTemplate<typeof ofUserType, "mes" | "ack">)
        })
    }
    const publishMessage: PublishMessage = (parts, toUserType, toGuessId) => {
        let channel
        const isToHostUser = toUserType === users.host

        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(isToHostUser)
                break
            case "mes":
            case "ack":
                channel = getMessagesChannel(isToHostUser, toGuessId)
                break
            default:
                throw new Error("should have been enter any case")
        }
        redisClient.publish(channel, getMessage(parts))
    }

    const cacheMessage: CacheMessage = (key, message) => { redisClient.set(key, message) }
    const removeMessage: RemoveMessage = (key) => { redisClient.del(key) }
    const isMessageAck: IsMessageAck = async (key) => await redisClient.get(key) === null

    const newUser: NewUser = (userType) => {
        let promise: Promise<number | void>
        if (userType === users.host) {
            promise = redisClient.sAdd(users.host, storageHostMemberId)
        } else {
            promise = redisClient.incr(users.guess + "-count").then(guessesCount => {
                redisClient.sAdd(users.guess, guessesCount + "")
                return guessesCount
            })
        }
        return promise
    }
    const removeUser: RemoveUser = (guessId) => {
        let key, member
        if (guessId) {
            key = users.guess
            member = guessId + ""
        } else {
            key = users.host
            member = storageHostMemberId
        }
        redisClient.sRem(key, member)
    }

    const getUsers: GetUsers = (userType) => {
        return redisClient.sMembers(users[userType]).then(ids => ids.map(id => parseInt(id)))
    }

    initWebSocket(subscribeToMessages, publishMessage, cacheMessage, removeMessage, isMessageAck, newUser, removeUser, getUsers)
}

dotenv.config()
init()
//setInterval(()=> console.log(users.host), 2000)