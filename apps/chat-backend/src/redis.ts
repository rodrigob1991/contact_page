import {messagePrefixes, users} from "chat-common/src/model/constants"
import {
    CutMessage,
    GetMessages,
    GotAllMessageParts,
    OutboundMessage,
    OutboundMessageTemplate
} from "chat-common/src/message/types"
import {getMessage} from "chat-common/src/message/functions"
import {MessagePrefix, UserType} from "chat-common/src/model/types"
import {log, SendMessage} from "./app"
import {createClient, createCluster} from "redis"
import {AnyPropertiesCombination} from "utils/src/types"
import { readFileSync } from "fs"

export type RedisMessageKey<M extends OutboundMessage[] = GetMessages<UserType, "out", MessagePrefix<"out">>> = M extends [infer OM, ...infer RM] ? OM extends OutboundMessage ? `${OM["userType"]}:${number}:${CutMessage<[OM], "body">}` | (RM extends OutboundMessage[] ? RedisMessageKey<RM> : never) : never : never
export type SubscribeToMessages = () => Promise<void>
export type UnsubscribeToMessages = () => Promise<void>
export type HandleUserSubscriptionToMessagesReturn = [SubscribeToMessages, UnsubscribeToMessages]
export type HandleUserSubscriptionToMessages = <UT extends UserType>(ofUserType: UT, ofUserId: number, sendMessage: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn
export type UserIdToPublish<MP extends MessagePrefix<"out">> = MP extends "mes" | "uack" ? number : undefined
// only for one message type, no unions.
export type PublishMessage = <M extends OutboundMessage>(toUserType: M["userType"], toUserId: UserIdToPublish<M["prefix"]>, messageParts: GotAllMessageParts<M>) => Promise<void>
export type  WhatPrefixes = AnyPropertiesCombination<{ [K in MessagePrefix<"out">]: true }>
export type GetCachedMessagesResult<UT extends UserType, WP extends WhatPrefixes> = {[P in keyof WP & MessagePrefix<"out">]: Promise<OutboundMessage<UT, P>["template"][]>}
type GetCachedMessages = <UT extends UserType, WP extends WhatPrefixes>(userType: UT, userId: number, whatPrefixes: WP) => GetCachedMessagesResult<UT, WP>
type CacheMessage = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>, message: M["template"]) => Promise<void>
export type RemoveMessage = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>) => Promise<boolean>
type IsMessageAck = <M extends OutboundMessage>(userType: M["userType"], userId: number, messagePrefix: M["prefix"], key: RedisMessageKey<[M]>) => Promise<boolean>
type UserId<UT extends UserType> = number | (UT extends "guess" ? undefined : never)
export type AddConnectedUserResult = Promise<{id: number, date: number}>
type AddConnectedUser = <UT extends UserType>(userType: UT, id: UserId<UT>) => AddConnectedUserResult
type RemoveConnectedUser = <UT extends UserType>(userType: UT, id: number) => Promise<void>
export type GetConnectedUsersResult = Promise<[number, number][]>
type GetConnectedUsers = (toUserType: UserType, toUserId: number) => GetConnectedUsersResult

export type RedisAPIs = { addConnectedUser: AddConnectedUser, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers,  publishMessage: PublishMessage, handleUserSubscriptionToMessages: HandleUserSubscriptionToMessages, cacheMessage: CacheMessage, getCachedMessages: GetCachedMessages, removeMessage: RemoveMessage, isMessageAck: IsMessageAck}

const initConnection = () => {
    const url = process.env.REDIS_URL
    const credentials = {username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD}
    const socket = {tls: process.env.REDIS_TLS !== undefined, keepAlive: 50000,connectTimeout: 50000, reconnectStrategy: (retries: number) => 1000}

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
    client.on('error', (err) => {
        log(err)
    })
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

    const getMessagesHashKey = (userType: UserType, userId: number, messagePrefix: MessagePrefix) => userType + ":" + userId + ":" + messagePrefix + ":messages"

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
                throw new Error("y" +
                    "should have been enter any case")
        }
        const message = getMessage(parts)

        return redisClient.publish(channel, message)
            .then(n => { log(n + " " + toUserType + " gotten the published message " + message, isToHostUser ? "guess" : "host", parts.userId)})
            .catch(getHandleError(publishMessage))
    }

    const cacheMessage: CacheMessage = (userType, userId, messagePrefix, key, message) =>
        redisClient.hSet(getMessagesHashKey(userType, userId, messagePrefix), key, message).then(n => {
            const cached = n > 0
            const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached"
            if (cached)
                log(msg, userType, userId)
            else return Promise.reject(userType + " : " + userId + " : " + msg)
        }).catch(getHandleError(cacheMessage))

    const getCachedMessages: GetCachedMessages = (userType, userId, whatPrefixes) => {
        const promises: any = {}
        for (const prefix in whatPrefixes) {
            promises[prefix] = redisClient.hVals(getMessagesHashKey(userType, userId, prefix as MessagePrefix))
                .then(messages => {
                    const number = messages.length
                    log(number + " " + prefix + " messages cached gotten" + (number > 0 ? ": " + messages : ""), userType, userId)
                    return messages
                }).catch(getHandleError(getCachedMessages))
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
            }).catch(getHandleError(removeMessage))

    const isMessageAck: IsMessageAck = (userType, userId, messagePrefix, key) =>
        redisClient.hExists(getMessagesHashKey(userType, userId, messagePrefix), key)
            .then(exist => {
                log("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged", userType, userId)
                return !exist
            }).catch(getHandleError(isMessageAck))

    const addConnectedUser: AddConnectedUser = (userType, id) => {
        const setConnectedUser = (firstTime: boolean, id: number) => {
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
            promise = setConnectedUser(false, id as number)
        } else {
            promise = (id === undefined ? redisClient.incr(guessCountKey).then<[number, true]>(newGuessId => [newGuessId, true]) : Promise.resolve<[number, false]>([id, false])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId))
        }
        return promise.catch(getHandleError(addConnectedUser))
    }
    const removeConnectedUser: RemoveConnectedUser = (userType, id) => {
        return redisClient.hDel(getConnectedUsersHashKey(userType), id.toString()).then(n => {
            if (n > 0) log("was removed from connected hash", userType, id)
            else return Promise.reject(userType + " " + id + " was not removed from connected hash")
        }).catch(getHandleError(removeConnectedUser))
    }

    const getConnectedUsers: GetConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host"
        return redisClient.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields)
            const usersConnectedNumber = fieldsEntries.length
            const areUsersConnected = fieldsEntries.length > 0
            log((areUsersConnected ? usersConnectedNumber : "no") + " " + ofUserType + " in connected hash: " + (areUsersConnected ? fieldsEntries : ""), toUserType, toUserId)
            return fieldsEntries.map(([idStr, dateStr]) => [+idStr, +dateStr] as [number, number])
        }).catch(getHandleError(getConnectedUsers))
    }

    const redisClient = initConnection()
    // delete all the data
    //redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))

    return  { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck }
}