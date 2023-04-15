import {messagePrefixes, users} from "chat-common/src/model/constants"
import {
    CutMessage,
    GetMessages,
    GotAllMessageParts,
    OutboundMessage,
    OutboundMessageTemplate
} from "chat-common/src/message/types"
import {getMessage} from "chat-common/src/message/functions"
import {MessageParts, MessagePrefix, UserType} from "chat-common/src/model/types"
import {SendMessage} from "./app"
import {createClient} from "redis"

export type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}${OM["userType"] extends "guess" ? `:${MessageParts["guessId"]}` : ""}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
type GuessIdToSubscribe<UT extends UserType> =
    ("guess" extends UT ? MessageParts["guessId"] : never)
    | ("host" extends UT ? undefined : never)
export type SubscribeToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => void
type GuessIdToPublish<UT extends UserType, MP extends MessagePrefix> = UT extends "guess" ? MP extends "mes" | "ack" ? MessageParts["guessId"] : undefined : undefined
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage>(messageParts: GotAllMessageParts<M>, toUserType: M["userType"], toGuessId: GuessIdToPublish<M["userType"], M["prefix"]>) => void
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => void
export type RemoveMessage = <M extends OutboundMessage[]>(key: RedisMessageKey<M>) => void
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type NewUserResult<UT extends UserType> = Promise<UT extends "guess" ? number : void>
type NewUser = <UT extends UserType>(userType: UT) => NewUserResult<UT>
type RemoveUser = (guessId: number | undefined) => Promise<void>
type GetUsers = (userType: UserType) => Promise<number[]>

export type RedisAPIs = { newUser: NewUser, removeUser: RemoveUser, publishMessage: PublishMessage, subscribeToMessages: SubscribeToMessages, cacheMessage: CacheMessage, isMessageAck: IsMessageAck, removeMessage: RemoveMessage, getUsers: GetUsers }

const initConnection = async () => {
    const client = createClient({
        url: process.env.URL,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    })
    client.on('error', (err) => {
        console.error(err)})
    client.on('connect', () => {
        console.log('connected with redis')
    })
    client.on('reconnecting', () => {
        console.log('reconnecting with redis')
    })
    client.on('ready', () => {
        console.log('redis is ready')
    })

    try {
        await client.connect()
    } catch (e) {
        console.log(`could not connect with redis:${e}`)
    }
    return client
}

export const getRedisAPIs = async () => {
    const hostSetKey = users.host
    const hostSetMemberId = "1"
    const guessSetKey = users.guess
    const guessCountKey = users.guess + "-count"

    const getConDisChannel = (isHostUser: boolean) => messagePrefixes.con + "-" + messagePrefixes.dis + "-" + (isHostUser ? users.host : users.guess)
    const getMessagesChannel = (isHostUser: boolean, guessId?: number) => messagePrefixes.mes + "-" + (isHostUser ? users.host : users.guess + "-" + guessId)

    const subscribeToMessages = async <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => {
        const subscriber = redisClient.duplicate()
        await subscriber.connect()

        const isHostUser = ofUserType === users.host

        await subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
            sendMessage(message as OutboundMessageTemplate<UT, "con" | "dis">)
        })
        await subscriber.subscribe(getMessagesChannel(isHostUser, guessId), (message, channel) => {
            sendMessage(message as OutboundMessageTemplate<UT, "mes" | "ack">)
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

    const cacheMessage: CacheMessage = (key, message) => {
        redisClient.set(key, message)
    }
    const removeMessage: RemoveMessage = (key) => {
        redisClient.del(key)
    }
    const isMessageAck: IsMessageAck = async (key) => await redisClient.get(key) === null

    const newUser: NewUser = <UT extends UserType>(userType: UT) => {
        let promise
        if (userType === users.host) {
            promise = redisClient.sMembers(hostSetKey).then(id => {
                if (id.length > 0) {
                    return Promise.reject("already host user connected")
                } else {
                    return redisClient.sAdd(hostSetKey, hostSetMemberId)
                }
            })
        } else {
            promise = redisClient.incr(guessCountKey).then(guessesCount => {
                redisClient.sAdd(guessSetKey, guessesCount + "")
                return guessesCount
            })
        }
        return promise as NewUserResult<UT>
    }
    const removeUser: RemoveUser = (guessId) => {
        let key, member
        if (guessId) {
            key = guessSetKey
            member = guessId + ""
        } else {
            key = hostSetKey
            member = hostSetMemberId
        }
        return redisClient.sRem(key, member).then()
    }

    const getUsers: GetUsers = (userType) => {
        const key = userType === users.host ? hostSetKey : guessSetKey
        return redisClient.sMembers(key).then(ids => ids.map(id => parseInt(id)))
    }

    const redisClient = await initConnection()
    // delete all the data
    redisClient.flushAll().then()

    return  { newUser: newUser, removeUser: removeUser, publishMessage: publishMessage, subscribeToMessages: subscribeToMessages, cacheMessage: cacheMessage, isMessageAck: isMessageAck, removeMessage: removeMessage, getUsers: getUsers }
}