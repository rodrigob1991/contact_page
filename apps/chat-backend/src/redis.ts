import {messagePrefixes, users} from "chat-common/src/model/constants"
import {
    CutMessage,
    GetMessages,
    GotAllMessageParts,
    OutboundMesMessage,
    OutboundMessage,
    OutboundMessageTemplate
} from "chat-common/src/message/types"
import {getMessage} from "chat-common/src/message/functions"
import {MessageParts, MessagePrefix, UserType} from "chat-common/src/model/types"
import {log, SendMessage} from "./app"
import {createClient} from "redis"

export type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}${OM["userType"] extends "guess" ? `:${MessageParts["guessId"]}` : ""}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
type GuessIdToSubscribe<UT extends UserType> =
    ("guess" extends UT ? MessageParts["guessId"] : never)
    | ("host" extends UT ? undefined : never)
export type UnsubscribeToMessages = () => Promise<void>
export type SubscribeUserToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => Promise<void>
export type GuessIdToPublish<UT extends UserType, MP extends MessagePrefix> = UT extends "guess" ? MP extends "mes" | "uack" ? MessageParts["guessId"] : undefined : undefined
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage>(messageParts: GotAllMessageParts<M>, toUserType: M["userType"], toGuessId: GuessIdToPublish<M["userType"], M["prefix"]>) => Promise<void>
type GetCachedMesMessages = (guessId: number | undefined) => Promise<OutboundMesMessage["template"][]>
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => Promise<boolean>
export type RemoveMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type NewUserResult<UT extends UserType> = Promise<UT extends "guess" ? number : void>
type NewUserGuessId<UT extends UserType> = (UT extends "guess" ? number : never) | undefined
type NewUser = <UT extends UserType>(userType: UT, guessId: NewUserGuessId<UT>) => NewUserResult<UT>
type RemoveUser = (guessId: number | undefined) => Promise<boolean>
type GetUsers = (userType: UserType) => Promise<number[]>

export type RedisAPIs = { newUser: NewUser, removeUser: RemoveUser, publishMessage: PublishMessage, subscribeUserToMessages: SubscribeUserToMessages, unsubscribeToMessages: UnsubscribeToMessages, cacheMessage: CacheMessage, getCachedMesMessages: GetCachedMesMessages, removeMessage: RemoveMessage, isMessageAck: IsMessageAck, getUsers: GetUsers }

const initConnection = () => {
    const client = createClient({
        url: process.env.URL,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
    })
    client.on('error', (err) => {
        log(err)})
    client.on('connect', () => {
        log('connected with redis')
    })
    client.on('reconnecting', () => {
        log('reconnecting with redis')
    })
    client.on('ready', () => {
        log('redis is ready')
    })
    client.connect()

    return client
}

export const initRedis = () : RedisAPIs => {
    const hostSetKey = users.host
    const hostSetMemberId = "1"
    const guessSetKey = users.guess
    const guessCountKey = users.guess + "-count"

    const getHandleError = (fn: Function) => (reason: string) => Promise.reject("redis error: " + fn.name + " failed, " + reason)

    const getConDisChannel = (isHostUser: boolean) => messagePrefixes.con + "-" + messagePrefixes.dis + "-" + (isHostUser ? users.host : users.guess)
    const getMessagesChannel = (isHostUser: boolean, guessId?: number) => messagePrefixes.mes + "-" + (isHostUser ? users.host : users.guess + "-" + guessId)

    let unsubscribeToMessages: UnsubscribeToMessages = () => Promise.reject("unsubscribed was not initialized")
    const callUnsubscribeToMessages = () => unsubscribeToMessages()

    const subscribeUserToMessages = <UT extends UserType>(sendMessage: SendMessage<UT>, ofUserType: UT, guessId: GuessIdToSubscribe<UT>) => {
        const isHostUser = ofUserType === users.host

        const subscriber = redisClient.duplicate()
        unsubscribeToMessages = () => subscriber.disconnect().then(() => log("subscribed to the channels", ofUserType, guessId)).catch(getHandleError(unsubscribeToMessages))

        return subscriber.connect().then(() =>
            Promise.all([subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
                sendMessage(message as OutboundMessageTemplate<UT, "con" | "dis">)
            }),
                subscriber.subscribe(getMessagesChannel(isHostUser, guessId), (message, channel) => {
                    sendMessage(message as OutboundMessageTemplate<UT, "mes" | "uack">)
                })])
                .then(() => {
                    log("unsubscribed to the channels", ofUserType, guessId)
                }))
            .catch(getHandleError(subscribeUserToMessages))
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

        return redisClient.publish(channel, message)
            .then(n => { log(n + " " + toUserType + " consumers got the message " + message) })
            .catch(getHandleError(publishMessage))
    }

    const cacheMessage: CacheMessage = (key, message) => redisClient.set(key, message).then(n => {
        const cached = n !== null
        log("message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached")
        return cached
    }).catch(getHandleError(cacheMessage))

    const getCachedMesMessages: GetCachedMesMessages = (guessId) => {
        const keyPrefix = (guessId !== undefined ? users.guess + ":" + guessId : users.host) + ":mes:"
        return redisClient.keys(keyPrefix + "*")
            .then(keys => keys.length > 0 ? redisClient.mGet(keys)
                .then(messages => messages as OutboundMesMessage["template"][]) : [])
            .catch(getHandleError(getCachedMesMessages))
    }

    const removeMessage: RemoveMessage = (key) => redisClient.del(key).then(n => {
        const removed = n > 0
        log("message with key " + key + " was " + (removed ? "" : "not ") + "removed")
        return removed})
        .catch(getHandleError(removeMessage))

    const isMessageAck: IsMessageAck = (key) => redisClient.get(key).then(m => m === null).catch(getHandleError(isMessageAck))

    const newUser: NewUser = <UT extends UserType>(userType: UT, guessId: NewUserGuessId<UT>) => {
        let promise
        if (userType === users.host) {
            promise = redisClient.sMembers(hostSetKey).then(set => {
                if (set.length > 0) {
                    return Promise.reject("host already in the set")
                } else {
                    return redisClient.sAdd(hostSetKey, hostSetMemberId).then(n => {
                        const added = n > 0
                        if (added)
                            log("added", "host")
                        else
                            return Promise.reject("host was not added")
                    })
                }
            })
        } else {
            const newGuess = guessId === undefined
            promise = (newGuess ? redisClient.incr(guessCountKey) : Promise.resolve(guessId)).then(guessId =>
                redisClient.sAdd(guessSetKey, guessId + "").then(n => {
                    let result
                    const added = n > 0
                    if (added) {
                        log((newGuess ? "new " : "") + "added", "guess", guessId)
                        result = guessId
                    } else {
                        result = Promise.reject("guess " + guessId + (newGuess ? " was not" : " already") + " added")
                    }
                    return result
                })
            )
        }
        return promise.catch(getHandleError(newUser)) as NewUserResult<UT>
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
            log(" was " + (removed ? "" : "not ") + "removed", guessId === undefined ? "host" : "guess", guessId)
            return removed})
            .catch(getHandleError(removeUser))
    }

    const getUsers: GetUsers = (userType) => {
        const key = userType === users.host ? hostSetKey : guessSetKey
        return redisClient.sMembers(key).then(set => {
            const areUsersConnected = set.length > 0
            log((areUsersConnected ? "" : "no ") + userType + " connected" + (areUsersConnected ? ": " + set : ""))
            return set.map(id => parseInt(id))})
            .catch(getHandleError(getUsers))
    }

    const redisClient = initConnection()
    // delete all the data
    redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))

    return  { newUser: newUser, removeUser: removeUser, publishMessage: publishMessage, subscribeUserToMessages: subscribeUserToMessages, unsubscribeToMessages: callUnsubscribeToMessages, cacheMessage: cacheMessage, getCachedMesMessages: getCachedMesMessages, removeMessage: removeMessage, isMessageAck: isMessageAck, getUsers: getUsers }
}