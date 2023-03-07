import ws, {IUtf8Message} from "websocket"
import {createClient} from 'redis'
import http from "http"
import dotenv from "dotenv"
import {getIndexOnOccurrence} from "common/src/utils/Strings"

const users = {host: "host", guess: "guess"} as const
const messageFlows = {in: "in", out: "out"} as const
const messagePrefixes = {con: "con", dis: "dis", mes: "mes", ack: "ack"} as const
const messageParts = {prefix: "prefix", originPrefix: "originPrefix", number: "number", guessId: "guessId", body: "body"} as const
//generic types
// type GetTypesStartOnPrefix<U extends string, P extends string> = { [M in U]: IsUnion<M> extends true ? GetTypesStartOnPrefix<M, P> : M extends `${infer MT}` ? MT extends `${P}${any}` ? MT : never : never }[U]
type UserType = typeof users[keyof typeof users]
type MessageFlow = typeof messageFlows[keyof typeof messageFlows]
type MessagePrefix<MF extends MessageFlow=MessageFlow> = typeof messagePrefixes["mes" | "ack"] | ("out" extends MF ? typeof messagePrefixes["con" | "dis"] : never)
type MessageParts = { [messageParts.prefix]: MessagePrefix, [messageParts.originPrefix]: MessagePrefix<"out">, [messageParts.number]: number, [messageParts.guessId]: number, [messageParts.body]: `-${string}`}
type MessagePartsKeys = keyof MessageParts
type PartTemplate<MPK extends MessagePartsKeys, MPKS extends MessagePartsKeys, S extends ":" | ""> = MPK extends MPKS ? `${S}${MessageParts[MPK]}` : ""
type MessageTemplateInstance<MP extends MessagePrefix, MPKS extends MessagePartsKeys> =
    `${MP}${PartTemplate<"originPrefix", MPKS, ":">}${PartTemplate<"number", MPKS, ":">}${PartTemplate<"guessId", MPKS, ":">}${PartTemplate<"body", MPKS, ":">}`
type CutMessage<M extends Message[], WC extends MessagePartsKeys> = M extends [infer OM, ...infer RM] ? OM extends Message ? MessageTemplateInstance<OM["prefix"], Exclude<OM["parts"], WC>> | (RM extends Message[] ? CutMessage<RM, WC> : never) : never : never

type SpecificMessagePartsKeys<UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>> =
    "prefix"
    | ("in" | "ack" extends MF | MP ? "originPrefix" : never)
    | "number"
    | ("mes" extends MP ? "body" : never)
    | ("host" extends UT ? "guessId" : never)

type SpecificMessagePartsPositions<SMPK extends MessagePartsKeys> = Pick<{ prefix: 1, originPrefix: 2, number: "originPrefix" extends SMPK ? 3 : 2, guessId: "originPrefix" extends SMPK ? 4 : 3, body: "guessId" extends SMPK ? 4 : 3 }, SMPK>
//type GetSpecificMessagePartsKeys<SMPP extends SpecificMessagePartsPositions<UserType, MessageFlow, MessagePrefix> =
type MessageInstance<UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>, SMPK extends SpecificMessagePartsKeys<UT, MF, MP> = SpecificMessagePartsKeys<UT, MF, MP>> = { userType: UT, flow: MF, prefix: MP, parts: SMPK, positions: SpecificMessagePartsPositions<SMPK>, template: MessageTemplateInstance<MP, SMPK> }

type OutboundToHostMesMessage = MessageInstance<"host", "out", "mes">
type OutboundToHostConMessage = MessageInstance<"host", "out", "con">
type OutboundToHostDisMessage = MessageInstance<"host", "out", "dis">
type OutboundToHostAckMessage = MessageInstance<"host", "out", "ack">
type OutboundToGuessMesMessage = MessageInstance<"guess", "out", "mes">
type OutboundToGuessConMessage = MessageInstance<"guess", "out", "con">
type OutboundToGuessDisMessage = MessageInstance<"guess", "out", "dis">
type OutboundToGuessAckMessage = MessageInstance<"guess", "out", "ack">
type OutboundMesMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostMesMessage : never) | ("guess" extends UT ? OutboundToGuessMesMessage : never)
type OutboundAckMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostAckMessage : never) | ("guess" extends UT ? OutboundToGuessAckMessage : never)
type OutboundConMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostConMessage : never) | ("guess" extends UT ? OutboundToGuessConMessage : never)
type OutboundDisMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostDisMessage : never) | ("guess" extends UT ? OutboundToGuessDisMessage : never)
type OutboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = ("con" extends MP ? OutboundConMessage<UT> : never) | ("dis" extends MP ? OutboundDisMessage<UT>: never)  | ("mes" extends MP ? OutboundMesMessage<UT>: never)  | ("ack" extends MP ? OutboundAckMessage<UT>: never)
// i dont`t use this way because the compiler cannot always infer the type
//type OutboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = GetTypesStartOnPrefix<OutboundConMessage<UT> | OutboundDisMessage<UT> | OutboundMesMessage<UT> | OutboundAckMessage<UT>, MP>
type OutboundMessageParts<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = OutboundMessage<UT, MP>["parts"]
type OutboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = OutboundMessage<UT, MP>["template"]

type InboundFromHostMesMessage = MessageInstance<"host","in","mes">
type InboundFromHostAckMessage = MessageInstance<"host","in","ack">
type InboundFromGuessMesMessage = MessageInstance<"guess","in","mes">
type InboundFromGuessAckMessage = MessageInstance<"guess","in","ack">
type InboundMesMessage<UT extends UserType=UserType> =   ("host" extends UT ? InboundFromHostMesMessage : never)  | ("guess" extends UT ? InboundFromGuessMesMessage : never)
type InboundAckMessage<UT extends UserType=UserType> = ("host" extends UT ? InboundFromHostAckMessage  : never) | ("guess" extends UT ? InboundFromGuessAckMessage : never)
type InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> =("mes" extends MP ? InboundMesMessage<UT> : never) | ("ack" extends MP ? InboundAckMessage<UT> : never)
// i dont`t use this way because the compiler cannot always infer the type
//type InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = GetTypesStartOnPrefix<InboundMesMessage<UT> | InboundAckMessage<UT>,MP>
type InboundMessageParts<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = InboundMessage<UT, MP>["parts"]
type InboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = InboundMessage<UT, MP>["template"]
type InboundMessageTarget<M extends InboundMessage, UT = M["userType"]> = OutboundMessage<UserType extends M["userType"] ? M["userType"] : Exclude<UserType, UT>,  M["prefix"]>
type InboundAckMessageOrigin<UT extends UserType = UserType, OP extends MessagePrefix<"out"> = MessagePrefix<"out">> = GetMessages<UT, "out", OP>

type Message<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = ("in" extends MF ? InboundMessage<UT, Exclude<MP, "con" | "dis">> : never)  | ("out" extends MF ? OutboundMessage<UT,MP> : never)
type MessagePartsPositions<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = Message<UT, MF, MP>["positions"]
type MessageTemplate<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = Message<UT, MF, MP>["template"]

type FilterMessage<M extends Message, UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>> = M["userType"] | M["flow"] | M["prefix"] extends UT | MF | MP ? [M] : []
type GetMessages<UT extends UserType = UserType, MF extends MessageFlow = MessageFlow, MP extends MessagePrefix<MF> = MessagePrefix<MF>> = [...FilterMessage<OutboundToHostMesMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostConMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostDisMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostAckMessage, UT, MF, MP>,
    ...FilterMessage<OutboundToGuessMesMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessConMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessDisMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessAckMessage, UT, MF, MP>, ...FilterMessage<InboundFromHostMesMessage, UT, MF, MP>, ...FilterMessage<InboundFromHostAckMessage, UT, MF, MP>,
    ...FilterMessage<InboundFromGuessMesMessage, UT, MF, MP>, ...FilterMessage<InboundFromGuessAckMessage, UT, MF, MP>]

type HandleMesMessage<UT extends UserType> = (m: InboundMessageTemplate<UT, "mes">) => void
type HandleAckMessage<UT extends UserType> = (a: InboundMessageTemplate<UT, "ack">) => void

type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}${OM["userType"] extends "guess" ? `:${MessageParts["guessId"]}` : ""}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
type GetRedisMessageKeyParams<M extends OutboundMessage> = { [K in Exclude<M["parts"], "body">]: MessageParts[K] }
type GetRedisMessageKey = <M extends OutboundMessage>(params: GetRedisMessageKeyParams<M>)=> RedisMessageKey<[M]>
// the message less the prefix
type RedisMessagePayload<MT extends OutboundMessageTemplate> = { [OMT in MT]: OMT extends `${MessagePrefix<"out">}:${infer R}` ? R : never }[MT]

type MessageAndKeyResult<M extends OutboundMessage> = [M["template"], RedisMessageKey<[M]>]
type GetConMessageAndKey = () => MessageAndKeyResult<OutboundConMessage>
type GetDisMessageAndKey = () => MessageAndKeyResult<OutboundDisMessage>
type GetMesMessageAndKey = () => MessageAndKeyResult<OutboundMesMessage>
type GetAckMessageAndKey = () => MessageAndKeyResult<OutboundAckMessage>

type SendMessage<UT extends UserType> = (...message: OutboundMessageTemplate<UT>[]) => void
type GuessIdToSubscribe<UT extends UserType> = ("guess" extends UT ? MessageParts["guessId"] : never) | ("host" extends UT ? undefined : never)
type SubscribeToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => void
type GuessIdToPublish<UT extends UserType, MP extends MessagePrefix> = UT extends "guess" ? MP extends "mes" | "ack" ? MessageParts["guessId"] : undefined : undefined
// only for one message type, no unions.
type PublishMessage = <M extends OutboundMessage>(messageParts: GetMessageParams<M>, toUserType: M["userType"], toGuessId: GuessIdToPublish<M["userType"], M["prefix"]>) => void
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => void
type RemoveMessage = <M extends OutboundMessage[]>(key: RedisMessageKey<M>) => void
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type NewUser = (userType: UserType) => Promise<number | void>
type RemoveUser = (guessId: number | undefined) => void
type GetUsers = (userType: UserType) => Promise<number[]>

// this is to filter the position that are not unions
type IfUniquePosition<P, K> = { [N in 1 | 2 | 3 | 4]: N extends P ? Exclude<P, N> extends never ? K : never : never }[1 | 2 | 3 | 4]
type CommonMessagePartsPositions<M extends Message, MPP = M["positions"]> = keyof { [K in M["parts"] as K extends keyof MPP ? IfUniquePosition<MPP[K], K> : never]: never }
type AnyMessagePartsPositions<M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP = M["positions"]> = { [K in CMPP]: K extends keyof MPP ? MPP[K] : never }
type GotMessageParts<M extends Message, CMPP extends CommonMessagePartsPositions<M>> = { [K in CMPP]: MessageParts[K] }
type LastPosition<MPP extends MessagePartsPositions, LASTS = [4, 3, 2, 1]> = LASTS extends [infer LAST, ...infer REST] ? LAST extends MPP[keyof MPP] ? LAST : LastPosition<MPP, REST> : never
type GetMessageParams<M extends Message> = { [K in keyof M["positions"] | "prefix"]: K extends "prefix" ? M["prefix"] : K extends MessagePartsKeys ? MessageParts[K] : never }

const getMessage = <M extends Message>(parts: GetMessageParams<M>) => {
    let message = ""
    if (messageParts.prefix in parts)
        message += parts.prefix
    if (messageParts.originPrefix in parts)
        message += ":" + parts.originPrefix
    if (messageParts.number in parts)
        message += ":" + parts.number
    if (messageParts.guessId in parts)
        message += ":" + parts.guessId
    if (messageParts.body in parts)
        message += ":" + parts.body

    return message as M["template"]
}

const getMessageParts = <M extends Message, CMPP extends CommonMessagePartsPositions<M>>(m: M["template"], whatGet: AnyMessagePartsPositions<M, CMPP>) => {
    const parts: any = {}
    const getPartSeparatorIndex = (occurrence: number) => getIndexOnOccurrence(m, ":", occurrence)
    if (messageParts.prefix in whatGet)
        parts["prefix"] = m.substring(0, 3)
    if (messageParts.originPrefix in whatGet)
        parts["originPrefix"] = m.substring(4, 7)
    if (messageParts.number in whatGet)
        parts["number"] = m.substring(8, getPartSeparatorIndex(whatGet.number as 2 | 3))
    if (messageParts.guessId in whatGet) {
        const guessIdPosition = whatGet.guessId as 3 | 4
        parts["guessId"] = m.substring(getPartSeparatorIndex(guessIdPosition - 1) + 1, getPartSeparatorIndex(guessIdPosition))
    }
    if (messageParts.body in whatGet)
        parts["body"] = m.substring(getPartSeparatorIndex((whatGet.body as 3 | 4) - 1) + 1, m.length - 1)

    return parts as GotMessageParts<M, CMPP>
}

const getCutMessage = <M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP extends M["positions"] = M["positions"]>(m: M["template"], whatCut: AnyMessagePartsPositions<M, CMPP>, lastPosition: LastPosition<MPP>) => {
    let cutMessage: string = m
    let position = 0
    let cutSize = 0
    let cutCount = 0
    let partStartIndex = 0
    let partEndIndex = 0
    const findPartBoundaryIndex = (start = true) => {
        const currentPosition = position - cutCount
        let index
        if (currentPosition === 1 && start) {
            index = 0
        } else if (start) {
            index = getIndexOnOccurrence(cutMessage, ":", currentPosition - 1) + 1
        } else {
            index = getIndexOnOccurrence(cutMessage, ":", currentPosition) - 1
        }
        return index
    }
    const cut = () => {
        let cutStartIndex = partStartIndex - (position === lastPosition ? 1 : 0)
        let cutEndIndex = partEndIndex + (position === lastPosition ? 0 : 2)
        cutMessage = cutMessage.substring(0, cutStartIndex ) + cutMessage.substring(cutEndIndex)
        cutSize += cutEndIndex - cutStartIndex
        cutCount ++
    }

    if (messageParts.prefix in whatCut) {
        position = 1
        partEndIndex = 2
        cut()
    }
    if (messageParts.originPrefix in whatCut) {
        position = 2
        partStartIndex = 4 - cutSize
        partEndIndex = 6 - cutSize
        cut()
    }
    if (messageParts.number in whatCut) {
        position = whatCut.number as 2 | 3
        partStartIndex = 8 - cutSize
        partEndIndex = findPartBoundaryIndex(false)
        cut()
    }
    if (messageParts.guessId in whatCut) {
        position = whatCut.guessId as 3 | 4
        partStartIndex = findPartBoundaryIndex()
        partEndIndex = findPartBoundaryIndex(false)
        cut()
    }
    if (messageParts.body in whatCut) {
        position = whatCut.body as 3 | 4
        partEndIndex = findPartBoundaryIndex()
        partEndIndex = m.length - 1
        cut()
    }

    return cutMessage as CutMessage<[M], CMPP>
}

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
            const connection = request.accept("echo-protocol", origin)
            console.log((connectionDate) + " connection accepted")

            const userType: UserType = request.httpRequest.headers.host_user === process.env.HOST_USER_SECRET ? users.host : users.guess
            const guessId = await newUser(userType)

            const sendMessage = (key: RedisMessageKey, message: OutboundMessageTemplate) => {
                cacheMessage(key, message)

                const resendUntilAck = () => {
                    connection.sendUTF(message)
                    setTimeout(() => {
                        isMessageAck(key).then(is => {
                            if (!is) {
                                resendUntilAck()
                            }
                        })
                    }, 5000)
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
                console.log((new Date()) + " message: " + message)
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
            promise = redisClient.incr(users.guess).then(guessesCount => {
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
        return redisClient.lRange(users[userType], 0, -1).then(ids => ids.map(id => parseInt(id)))
    }

    initWebSocket(subscribeToMessages, publishMessage, cacheMessage, removeMessage, isMessageAck, newUser, removeUser, getUsers)
}

dotenv.config()
init()