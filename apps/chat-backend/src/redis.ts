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
import {MessagePrefix, UserType} from "chat-common/src/model/types"
import {log, SendMessage} from "./app"
import {createClient} from "redis"

export type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}:${number}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
export type SubscribeToMessages = () => Promise<void>
export type UnsubscribeToMessages = () => Promise<void>
export type HandleUserSubscriptionToMessagesReturn = [SubscribeToMessages, UnsubscribeToMessages]
export type HandleUserSubscriptionToMessages = <UT extends UserType>(ofUserType: UT, ofUserId: number, sendMessage: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn
export type UserIdToPublish<MP extends MessagePrefix<"out">> = MP extends "mes" | "uack" ? number : undefined
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage>(toUserType: M["userType"], toUserId: UserIdToPublish<M["prefix"]>, messageParts: GotAllMessageParts<M>) => Promise<void>
type GetCachedMesMessages = <UT extends UserType>(userType: UT, userId: number) => Promise<OutboundMesMessage<UT>["template"][]>
type CacheMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>, message: M["template"]) => Promise<void>
export type RemoveMessage = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type IsMessageAck = <M extends OutboundMessage>(key: RedisMessageKey<[M]>) => Promise<boolean>
type UserId<UT extends UserType> = number | (UT extends "guess" ? undefined : never)
export type AddConnectedUserResult = Promise<{id: number, date: number}>
type AddConnectedUser = <UT extends UserType>(userType: UT, id: UserId<UT>) => AddConnectedUserResult
type RemoveConnectedUser = <UT extends UserType>(userType: UT, id: number) => Promise<void>
export type GetConnectedUsersResult = Promise<[number, number][]>
type GetConnectedUsers = (toUserType: UserType, toUserId: number) => GetConnectedUsersResult

export type RedisAPIs = { addConnectedUser: AddConnectedUser, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers,  publishMessage: PublishMessage, handleUserSubscriptionToMessages: HandleUserSubscriptionToMessages, cacheMessage: CacheMessage, getCachedMesMessages: GetCachedMesMessages, removeMessage: RemoveMessage, isMessageAck: IsMessageAck}

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
    const guessCountKey = users.guess + "-count"

    const connectedHostsHashKey = "connected:host"
    const connectedGuessesHashKey = "connected:guesses"
    const getConnectedUsersHashKey = (userType: UserType) => userType === "host" ?  connectedHostsHashKey : connectedGuessesHashKey

    const getConnectedUserHashField = (userType: UserType, id: number) => userType + ":" + id

    const conMessagesHashSuffix = ":" + messagePrefixes.con + ":messages"
    const disMessagesHashSuffix = ":" + messagePrefixes.dis + ":messages"
    const mesMessagesHashSuffix = ":" + messagePrefixes.mes + ":messages"
    const uackMessagesHashSuffix = ":" + messagePrefixes.uack + ":messages"

    const hostConMessagesHash = users.host + conMessagesHashSuffix
    const hostDisMessagesHash = users.host + disMessagesHashSuffix
    const hostMesMessagesHash = users.host + mesMessagesHashSuffix
    const hostUackMessagesHash= users.host + uackMessagesHashSuffix

    const getGuessConMessagesHash = (guessId: number) => users.guess + ":" + guessId + conMessagesHashSuffix
    const getGuessDisMessagesHash = (guessId: number) => users.guess + ":" + guessId + disMessagesHashSuffix
    const getGuessMesMessagesHash = (guessId: number) => users.guess + ":" + guessId + mesMessagesHashSuffix
    const getGuessUackMessagesHash = (guessId: number) => users.guess + ":" + guessId + uackMessagesHashSuffix

    const getHandleError = (fn: Function) => (reason: string) => Promise.reject("redis error: " + fn.name + " failed, " + reason)

    const getConDisChannel = (isHostUser: boolean) => messagePrefixes.con + ":" + messagePrefixes.dis + ":" + (isHostUser ? users.host : users.guess)
    const getMessagesChannel = (isHostUser: boolean, userId: number) => messagePrefixes.mes + ":" + (isHostUser ? users.host : users.guess) + ":" + userId

    const handleUserSubscriptionToMessages: HandleUserSubscriptionToMessages = <UT extends UserType>(ofUserType: UT, ofUserId: number, sendMessage: SendMessage<UT>) => {
        const isHostUser = ofUserType === users.host

        const subscriber = redisClient.duplicate()

        const logErrorSendMessage = (message: string, reason: string) => {log("could not send message " + message + ", " + reason, ofUserType, ofUserId)}

        const subscribe = () => subscriber.connect().then(() =>
            Promise.all([subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
                // @ts-ignore
                sendMessage(true, message as OutboundMessageTemplate<UT, "con" | "dis">).catch((r)=> {logErrorSendMessage(message, r)})
            }),
                subscriber.subscribe(getMessagesChannel(isHostUser, ofUserId), (message, channel) => {
                    // @ts-ignore
                    sendMessage(false, message as OutboundMessageTemplate<UT, "mes" | "uack">).catch((r)=> {logErrorSendMessage(message, r)})
                })])
                .then(() => {
                    log("subscribed to the channels", ofUserType, ofUserId)
                }))
            .catch(getHandleError(subscribe))
        const unsubscribe = () => subscriber.disconnect().then(() => log("unsubscribed to the channels", ofUserType, ofUserId)).catch(getHandleError(unsubscribe))

        return [subscribe, unsubscribe]
    }
    const publishMessage: PublishMessage = (toUserType, toUserId, parts) => {
        let channel
        const isToHostUser = toUserType === users.host

        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(isToHostUser)
                break
            case "mes":
            case "uack":
                channel = getMessagesChannel(isToHostUser, toUserId as number)
                break
            default:
                throw new Error("should have been enter any case")
        }
        const message = getMessage(parts)

        return redisClient.publish(channel, message)
            .then(n => { log(n + " " + toUserType + " got the published message " + message, isToHostUser ? "guess" : "host", parts.userId)})
            .catch(getHandleError(publishMessage))
    }

    const cacheMessage: CacheMessage = (key, message) => redisClient.set(key, message).then(n => {
        const cached = n !== null
        const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached"
        if (cached)
            log(msg)
        else return Promise.reject(msg)
    }).catch(getHandleError(cacheMessage))

    const getCachedMesMessages: GetCachedMesMessages = (userType, userId) => {
        const keyPrefix = userType + (userType === "guess" ? ":" + gueId : "") + ":" + messagePrefixes.mes + ":"
        return redisClient.keys(keyPrefix + "*")
            .then(keys => keys.length > 0 ? redisClient.mGet(keys)
                .then(messages => {
                    log("got cached messages: " + messages, userType, guessId)
                    return messages as OutboundMesMessage["template"][]
                }) : [])
            .catch(getHandleError(getCachedMesMessages))
    }

    const removeMessage: RemoveMessage = (key) => redisClient.del(key).then(n => {
        const removed = n > 0
        log("message with key " + key + " was " + (removed ? "" : "not ") + "removed")
        return removed})
        .catch(getHandleError(removeMessage))

    const isMessageAck: IsMessageAck = (key) => redisClient.get(key).then(m => {
        const exist = m !== null
        log("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged")
        return !exist
    }).catch(getHandleError(isMessageAck))

    const addConnectedUser: AddConnectedUser = (userType, id) => {
        const setConnectedUser = (firstTime: "first time" | "", id: number) => {
            const date = Date.now()
            return redisClient.hSetNX(getConnectedUsersHashKey(userType), getConnectedUserHashField(userType, id), date.toString()).then(added => {
                if (added) {
                    log(firstTime +  " connected", userType, id)
                    return {id: id, date: date}
                } else {
                    return Promise.reject(userType + " " + id + " was not added to connected hash")
                }
            })
        }
        let promise
        if (userType === "host") {
            promise = setConnectedUser("", id as number)
        } else {
            promise = (id === undefined ? redisClient.incr(guessCountKey).then<[number, "first time"]>(newGuessId => [newGuessId, "first time"]) : Promise.resolve<[number, ""]>([id, ""])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId))
        }
        return promise.catch(getHandleError(addConnectedUser))
    }
    const removeConnectedUser: RemoveConnectedUser = (userType, id) => {
        return redisClient.hDel(getConnectedUsersHashKey(userType), getConnectedUserHashField(userType, id)).then(n => {
            if (n > 0) log("was removed", userType, id)
            else return Promise.reject(userType + " " + id + " was not removed")
        }).catch(getHandleError(removeConnectedUser))
    }

    const getConnectedUsers: GetConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host"
        return redisClient.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields)
            const areUsersConnected = fieldsEntries.length > 0
            log((areUsersConnected ? "" : "no ") + ofUserType + " connected " + fields.toString(), toUserType, toUserId)
            return fieldsEntries.map(([idStr, dateStr]) => [+idStr, +dateStr] as [number, number])
        }).catch(getHandleError(getConnectedUsers))
    }

    const redisClient = initConnection()
    // delete all the data
    redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))

    return  { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMesMessages, removeMessage, isMessageAck }
}