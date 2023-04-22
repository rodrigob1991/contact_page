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
export type Unsubscribe = () => Promise<void>
export type SubscribeToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => Promise<Unsubscribe>
type GuessIdToPublish<UT extends UserType, MP extends MessagePrefix> = UT extends "guess" ? MP extends "mes" | "uack" ? MessageParts["guessId"] : undefined : undefined
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage>(messageParts: GotAllMessageParts<M>, toUserType: M["userType"], toGuessId: GuessIdToPublish<M["userType"], M["prefix"]>) => Promise<void>
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => Promise<boolean>
export type RemoveMessage = <M extends OutboundMessage[]>(key: RedisMessageKey<M>) => Promise<boolean>
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type NewUserResult<UT extends UserType> = Promise<UT extends "guess" ? number : boolean>
type NewUser = <UT extends UserType>(userType: UT) => NewUserResult<UT>
type RemoveUser = (guessId: number | undefined) => Promise<boolean>
type GetUsers = (userType: UserType) => Promise<number[]>

export type RedisAPIs = { newUser: NewUser, removeUser: RemoveUser, publishMessage: PublishMessage, subscribeToMessages: SubscribeToMessages, cacheMessage: CacheMessage, isMessageAck: IsMessageAck, removeMessage: RemoveMessage, getUsers: GetUsers }

const initConnection = () => {
    const client = createClient({
        url: process.env.URL,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
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

    return client.connect().then(() => client)
}

export const initRedis = async () : Promise<RedisAPIs> => {
    const hostSetKey = users.host
    const hostSetMemberId = "1"
    const guessSetKey = users.guess
    const guessCountKey = users.guess + "-count"

    const getConDisChannel = (isHostUser: boolean) => messagePrefixes.con + "-" + messagePrefixes.dis + "-" + (isHostUser ? users.host : users.guess)
    const getMessagesChannel = (isHostUser: boolean, guessId?: number) => messagePrefixes.mes + "-" + (isHostUser ? users.host : users.guess + "-" + guessId)

    const subscribeToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => {
        const isHostUser = ofUserType === users.host

        const subscriber = redisClient.duplicate()
        const log = (action: "subscribed" | "unsubscribed") => { console.log(ofUserType + (guessId ? (" " + guessId) : "") + " " + action + " to the channels") }
        const unsubscribe: Unsubscribe = () => subscriber.disconnect().then(() => log("unsubscribed"))

        return subscriber.connect().then(() =>
            Promise.all([subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
                sendMessage(message as OutboundMessageTemplate<UT, "con" | "dis">)
            }),
                subscriber.subscribe(getMessagesChannel(isHostUser, guessId), (message, channel) => {
                    sendMessage(message as OutboundMessageTemplate<UT, "mes" | "uack">)
                })])
                .then(() => {
                    log("subscribed")
                    return unsubscribe
                })
        )
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
            case "uack":
                channel = getMessagesChannel(isToHostUser, toGuessId)
                break
            default:
                throw new Error("should have been enter any case")
        }
        const message = getMessage(parts)

        return redisClient.publish(channel, message).then(n => { console.log(n + " " + toUserType + " consumers got the message " + message) })
    }

    const cacheMessage: CacheMessage = (key, message) => redisClient.set(key, message).then(n => {
        const cached = n !== null
        console.log("message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached")
        return cached
    })

    const removeMessage: RemoveMessage = (key) => redisClient.del(key).then(n => {
        const removed = n > 0
        console.log("message with key " + key + " was " + (removed ? "" : "not ") + "removed")
        return removed
    })
    const isMessageAck: IsMessageAck = (key) => redisClient.get(key).then(m => m === null)

    const newUser: NewUser = <UT extends UserType>(userType: UT) => {
        let promise
        if (userType === users.host) {
            promise = redisClient.sMembers(hostSetKey).then(set => {
                if (set.length > 0) {
                    console.log("host already in the set")
                    return false
                } else {
                    return redisClient.sAdd(hostSetKey, hostSetMemberId).then(n => {
                        const added = n > 0
                        console.log("host was " + (added ? "" : "not ") + "added")
                        return added
                    })
                }
            })
        } else {
            promise = redisClient.incr(guessCountKey).then(guessesCount =>
                redisClient.sAdd(guessSetKey, guessesCount + "").then(n => n > 0 ? guessesCount : Promise.reject("guess " + guessesCount + " was not added"))
            )
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
        return redisClient.sRem(key, member).then(n => {
            const removed = n > 0
            console.log(" user " + (guessId || "host") + " was " + (removed ? "" : "not ") + "removed")
            return removed
        })
    }

    const getUsers: GetUsers = (userType) => {
        const key = userType === users.host ? hostSetKey : guessSetKey
        return redisClient.sMembers(key).then(set => {
            const areUsersConnected = set.length > 0
            console.log((areUsersConnected ? "" : "no ") + userType + " connected" + (areUsersConnected ? ": " + set : ""))
            return set.map(id => parseInt(id))
        })
    }

    const redisClient = await initConnection()
    // delete all the data
    redisClient.flushAll().then()

    return  { newUser: newUser, removeUser: removeUser, publishMessage: publishMessage, subscribeToMessages: subscribeToMessages, cacheMessage: cacheMessage, isMessageAck: isMessageAck, removeMessage: removeMessage, getUsers: getUsers }
}