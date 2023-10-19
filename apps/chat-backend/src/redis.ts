import {messagePrefixes, oppositeUserTypes, userTypes} from "chat-common/src/model/constants"
import {
    CutMessage,
    GetMessages,
    GotAllMessageParts,
    OutboundMessage,
    OutboundMessageTemplate
} from "chat-common/src/message/types"
import {getMessage} from "chat-common/src/message/functions"
import {MessagePrefix, MessagePrefixOut, UserType} from "chat-common/src/model/types"
import {getHandleError, log, panic, SendMessage} from "./app"
import {createClient, createCluster} from "redis"
import {AnyPropertiesCombination} from "utils/src/types"

export type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}:${number}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
export type SubscribeToMessages = () => Promise<void>
export type UnsubscribeToMessages = () => Promise<void>
export type HandleUserSubscriptionToMessagesReturn = [SubscribeToMessages, UnsubscribeToMessages]
export type HandleUserSubscriptionToMessages = <UT extends UserType>(ofUserType: UT, ofUserId: number, sendMessage: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn

export type UserIdToPublish<MP extends MessagePrefix<"out">> = MP extends "mes" | "uack" ? number : undefined
export type PublishMessagePrefix = Exclude<MessagePrefixOut, "sack" | "usrs">
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage<UserType, PublishMessagePrefix>>(toUserType: M["userType"], toUserId: UserIdToPublish<M["prefix"]>, messageParts: GotAllMessageParts<M>) => Promise<void>

export type  WhatPrefixes = AnyPropertiesCombination<{ [K in MessagePrefix<"out">]: true }>
export type GetCachedMessagesResult<UT extends UserType, WP extends WhatPrefixes> = {[P in keyof WP & MessagePrefix<"out">]: Promise<OutboundMessage<UT, P>["template"][]>}
type GetCachedMessages = <UT extends UserType, WP extends WhatPrefixes>(userType: UT, userId: number, whatPrefixes: WP) => GetCachedMessagesResult<UT, WP>

type CacheMessage = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>, message: M["template"]) => Promise<void>

export type RemoveMessage = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>) => Promise<boolean>

type IsMessageAck = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>) => Promise<boolean>
type UserId<UT extends UserType> = number | (UT extends "guess" ? undefined : never)
export type AddConnectedUserResult = Promise<{id: number, date: number}>
export type AddConnectedUser = <UT extends UserType=UserType>(userType: UT, id: UserId<UT>) => AddConnectedUserResult
type RemoveConnectedUser = <UT extends UserType>(userType: UT, id: number) => Promise<void>
type ConnectedUsers = { [id: number]: number }
export type GetConnectedUsersResult = Promise<ConnectedUsers>
type GetConnectedUsers = (toUserType: UserType, toUserId: number) => GetConnectedUsersResult

export type RedisAPIs = { addConnectedUser: AddConnectedUser, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers,  publishMessage: PublishMessage, handleUserSubscriptionToMessages: HandleUserSubscriptionToMessages, cacheMessage: CacheMessage, getCachedMessages: GetCachedMessages, removeMessage: RemoveMessage, isMessageAck: IsMessageAck}

export type HandleOnError = (error: Error) => void
export type HandleOnReady = () => void

const initConnection = (handleOnError: HandleOnError, handleOnReady: HandleOnReady) => {
    const url = process.env.REDIS_URL
    const credentials = {username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD}
    const socket = {tls: process.env.REDIS_TLS !== undefined}

    const client = process.env.REDIS_CLUSTER !== undefined ?
        createCluster({
            rootNodes: [{
                url
            }],
            defaults: {
                ...credentials,
                socket
            }
        }) :
        createClient({
            url,
            ...credentials,
            socket
        })
    client.on("error", (error: Error) => {
        log("redis error: " + error.message)
        handleOnError(error)
    })
    client.on("connect", () => {
        log("connected with redis")
    })
    client.on("reconnecting", () => {
        log("reconnecting with redis")
    })
    client.on("ready", () => {
        log("redis is ready")
        handleOnReady()
    })
    client.connect().catch((handleOnError))

    return client
}

export const initRedis = (handleOnError: HandleOnError, handleOnReady: HandleOnReady) : RedisAPIs => {
    const guessCountKey = userTypes.guess + "-count"

    const connectedUsersHashKeyPrefix = "connected:"
    const connectedHostsHashKey = connectedUsersHashKeyPrefix + userTypes.host
    const connectedGuessesHashKey = connectedUsersHashKeyPrefix + userTypes.guess
    const getConnectedUsersHashKey = (userType: UserType) => userType === "host" ?  connectedHostsHashKey : connectedGuessesHashKey

    const getMessagesHashKey = (userType: UserType, userId: number, messagePrefix: MessagePrefix) => userType + ":" + userId + ":" + messagePrefix + ":messages"

    const getRejectError = (fn: (...args: any[]) => any, reason2?: string) => (reason1: string) => Promise.reject("redis error: " + fn.name + " failed, " + (reason2 !== undefined ? reason2 + ", " : "") + reason1)

    const getConDisChannel = (userType: UserType) => messagePrefixes.con + ":" + messagePrefixes.dis + ":" + userType
    const getMessagesChannel = (userType: UserType, userId: number) => messagePrefixes.mes + ":" + userType + ":" + userId

    const handleUserSubscriptionToMessages: HandleUserSubscriptionToMessages = <UT extends UserType>(ofUserType: UT, ofUserId: number, sendMessage: SendMessage<UT>) => {
        const subscriber = redisClient.duplicate()

        const getHandleErrorSendMessage = (message: string) => getHandleError(sendMessage, "consuming message: " + message, ofUserType, ofUserId)
        const subscribe = () => subscriber.connect().then(() =>
            Promise.all([
                subscriber.subscribe(getConDisChannel(ofUserType), (message, channel) => {
                    // @ts-ignore
                    sendMessage(true, message as OutboundMessageTemplate<UT, "con" | "dis">).catch(getHandleErrorSendMessage(message))
                }),
                subscriber.subscribe(getMessagesChannel(ofUserType, ofUserId), (message, channel) => {
                    // @ts-ignore
                    sendMessage(false, message as OutboundMessageTemplate<UT, "mes" | "uack">).catch(getHandleErrorSendMessage(message))
                })])
                .then(() => {
                    log("subscribed to the channels", ofUserType, ofUserId)
                }))
            .catch(getRejectError(subscribe))
        const unsubscribe = () => subscriber.disconnect().then(() => { log("unsubscribed to the channels", ofUserType, ofUserId) }).catch(getRejectError(unsubscribe))

        return [subscribe, unsubscribe]
    }
    const publishMessage: PublishMessage = (toUserType, toUserId, parts) => {
        let channel
        const publisherType = oppositeUserTypes[toUserType]
        const publisherId = parts.userId

        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(toUserType)
                break
            case "mes":
            case "uack":
                channel = getMessagesChannel(toUserType, toUserId as number)
                break
            default:
                panic("should have been enter any case")
        }
        const message = getMessage(parts)

        // @ts-ignore: typescript complain about message is not assign, because it does not consider panic throw an error.
        return redisClient.publish(channel, message)
            .then(n => { log(n + " " + toUserType + " gotten the published message " + message, publisherType, publisherId)})
            .catch(getRejectError(publishMessage))
    }

    const cacheMessage: CacheMessage = (userType, userId, messagePrefix, key, message) =>
        redisClient.hSet(getMessagesHashKey(userType, userId, messagePrefix), key, message).then(n => {
            const cached = n > 0
            const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached"
            if (cached)
                log(msg, userType, userId)
            else return Promise.reject(msg)
        }).catch(getRejectError(cacheMessage, userType + " : " + userId + ", " + messagePrefix + ":" + key + ":" + message))

    const getCachedMessages: GetCachedMessages = (userType, userId, whatPrefixes) => {
        const promises: { [k: string]: Promise<string[]> } = {}
        for (const prefix in whatPrefixes) {
            promises[prefix] = redisClient.hVals(getMessagesHashKey(userType, userId, prefix as MessagePrefix))
                .then(messages => {
                    const number = messages.length
                    log(number + " " + prefix + " messages cached gotten" + (number > 0 ? ": " + messages.toString() : ""), userType, userId)
                    return messages
                }).catch(getRejectError(getCachedMessages))
        }
        return promises as GetCachedMessagesResult<typeof userType, typeof whatPrefixes>
    }

    // maybe reject the promise if the message was not removed
    const removeMessage: RemoveMessage = (userType, userId, messagePrefix, key) =>
        redisClient.hDel(getMessagesHashKey(userType, userId, messagePrefix), key)
            .then(n => {
                const removed = n > 0
                log("message with key " + key + " was " + (removed ? "" : "not ") + "removed", userType, userId)
                return removed
            }).catch(getRejectError(removeMessage))

    const isMessageAck: IsMessageAck = (userType, userId, messagePrefix, key) =>
        redisClient.hExists(getMessagesHashKey(userType, userId, messagePrefix), key)
            .then(exist => {
                log("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged", userType, userId)
                return !exist
            }).catch(getRejectError(isMessageAck, userType + " " + userId + ", " + messagePrefix + " " + key))

    const addConnectedUser: AddConnectedUser = (userType, id) => {
        const setConnectedUser = async (firstTime: boolean, id: number) => {
            const date = Date.now()
            return redisClient.hSetNX(getConnectedUsersHashKey(userType), id.toString(), date.toString()).then(added => {
                if (added) {
                    log((firstTime ? "first time " : "") +  "added to connected hash", userType, id)
                    return {id: id, date: date}
                } else {
                    return Promise.reject(userType + " " + id + " was not added to connected hash")
                }
            })
        }
        let promise
        if (userType === "host") {
            promise = setConnectedUser(false, id as UserId<"host">)
        } else {
            promise = (id === undefined ? redisClient.incr(guessCountKey).then<[number, true]>(newGuessId => [newGuessId, true]) : Promise.resolve<[number, false]>([id, false])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId))
        }
        return promise.catch(getRejectError(addConnectedUser))
    }
    const removeConnectedUser: RemoveConnectedUser = (userType, id) => {
        return redisClient.hDel(getConnectedUsersHashKey(userType), id.toString()).then(n => {
            if (n > 0) log("was removed from connected hash", userType, id)
            else return Promise.reject(userType + " " + id + " was not removed from connected hash")
        }).catch(getRejectError(removeConnectedUser))
    }

    const getConnectedUsers: GetConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host"
        return redisClient.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields)
            const usersConnectedNumber = fieldsEntries.length
            const areUsersConnected = fieldsEntries.length > 0
            log((areUsersConnected ? usersConnectedNumber : "no") + " " + ofUserType + " in connected hash: " + (areUsersConnected ? fieldsEntries.toString() : ""), toUserType, toUserId)
            const users: ConnectedUsers = {}
            fieldsEntries.forEach(([idStr, dateStr]) => { users[+idStr] = +dateStr })
            return users
        }).catch(getRejectError(getConnectedUsers))
    }

    const redisClient = initConnection(handleOnError, handleOnReady)
    // delete all the data
    //redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))

    return  { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck }
}