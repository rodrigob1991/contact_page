"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = void 0;
const constants_1 = require("chat-common/src/model/constants");
const functions_1 = require("chat-common/src/message/functions");
const app_1 = require("./app");
const redis_1 = require("redis");
const initConnection = (handleOnError, handleOnReady) => {
    const url = process.env.REDIS_URL;
    const credentials = { username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD };
    const socket = { tls: process.env.REDIS_TLS !== undefined };
    const client = process.env.REDIS_CLUSTER !== undefined ?
        (0, redis_1.createCluster)({
            rootNodes: [{
                    url
                }],
            defaults: Object.assign(Object.assign({}, credentials), { socket })
        }) :
        (0, redis_1.createClient)(Object.assign(Object.assign({ url }, credentials), { socket }));
    client.on("error", (error) => {
        (0, app_1.log)("redis error: " + error.message);
        handleOnError(error);
    });
    client.on("connect", () => {
        (0, app_1.log)("connected with redis");
    });
    client.on("reconnecting", () => {
        (0, app_1.log)("reconnecting with redis");
    });
    client.on("ready", () => {
        (0, app_1.log)("redis is ready");
        handleOnReady();
    });
    client.connect().catch((handleOnError));
    return client;
};
const initRedis = (handleOnError, handleOnReady) => {
    const guessCountKey = constants_1.userTypes.guess + "-count";
    const connectedUsersHashKeyPrefix = "connected:";
    const connectedHostsHashKey = connectedUsersHashKeyPrefix + constants_1.userTypes.host;
    const connectedGuessesHashKey = connectedUsersHashKeyPrefix + constants_1.userTypes.guess;
    const getConnectedUsersHashKey = (userType) => userType === "host" ? connectedHostsHashKey : connectedGuessesHashKey;
    const getMessagesHashKey = (userType, userId, messagePrefix) => userType + ":" + userId + ":" + messagePrefix + ":messages";
    const getRejectError = (fn, reason2) => (reason1) => Promise.reject("redis error: " + fn.name + " failed, " + (reason2 !== undefined ? reason2 + ", " : "") + reason1);
    const getConDisChannel = (userType) => constants_1.messagePrefixes.con + ":" + constants_1.messagePrefixes.dis + ":" + userType;
    const getMessagesChannel = (userType, userId) => constants_1.messagePrefixes.mes + ":" + userType + ":" + userId;
    const handleUserSubscriptionToMessages = (ofUserType, ofUserId, sendMessage) => {
        const subscriber = redisClient.duplicate();
        const getHandleErrorSendMessage = (message) => (0, app_1.getHandleError)(sendMessage, "consuming message: " + message, ofUserType, ofUserId);
        const subscribe = () => subscriber.connect().then(() => Promise.all([
            subscriber.subscribe(getConDisChannel(ofUserType), (message, channel) => {
                // @ts-ignore
                sendMessage(true, message).catch(getHandleErrorSendMessage(message));
            }),
            subscriber.subscribe(getMessagesChannel(ofUserType, ofUserId), (message, channel) => {
                // @ts-ignore
                sendMessage(false, message).catch(getHandleErrorSendMessage(message));
            })
        ])
            .then(() => {
            (0, app_1.log)("subscribed to the channels", ofUserType, ofUserId);
        }))
            .catch(getRejectError(subscribe));
        const unsubscribe = () => subscriber.disconnect().then(() => { (0, app_1.log)("unsubscribed to the channels", ofUserType, ofUserId); }).catch(getRejectError(unsubscribe));
        return [subscribe, unsubscribe];
    };
    const publishMessage = (toUserType, toUserId, parts) => {
        let channel;
        const publisherType = constants_1.oppositeUserTypes[toUserType];
        const publisherId = parts.userId;
        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(toUserType);
                break;
            case "mes":
            case "uack":
                channel = getMessagesChannel(toUserType, toUserId);
                break;
            default:
                (0, app_1.panic)("should have been enter any case");
        }
        const message = (0, functions_1.getMessage)(parts);
        // @ts-ignore: typescript complain about message is not assign, because it does not consider panic throw an error.
        return redisClient.publish(channel, message)
            .then(n => { (0, app_1.log)(n + " " + toUserType + " gotten the published message " + message, publisherType, publisherId); })
            .catch(getRejectError(publishMessage));
    };
    const cacheMessage = (userType, userId, messagePrefix, key, message) => redisClient.hSet(getMessagesHashKey(userType, userId, messagePrefix), key, message).then(n => {
        const cached = n > 0;
        const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached";
        if (cached)
            (0, app_1.log)(msg, userType, userId);
        else
            return Promise.reject(msg);
    }).catch(getRejectError(cacheMessage, userType + " : " + userId + ", " + messagePrefix + ":" + key + ":" + message));
    const getCachedMessages = (userType, userId, whatPrefixes) => {
        const promises = {};
        for (const prefix in whatPrefixes) {
            promises[prefix] = redisClient.hVals(getMessagesHashKey(userType, userId, prefix))
                .then(messages => {
                const number = messages.length;
                (0, app_1.log)(number + " " + prefix + " messages cached gotten" + (number > 0 ? ": " + messages.toString() : ""), userType, userId);
                return messages;
            }).catch(getRejectError(getCachedMessages));
        }
        return promises;
    };
    // maybe reject the promise if the message was not removed
    const removeMessage = (userType, userId, messagePrefix, key) => redisClient.hDel(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(n => {
        const removed = n > 0;
        (0, app_1.log)("message with key " + key + " was " + (removed ? "" : "not ") + "removed", userType, userId);
        return removed;
    }).catch(getRejectError(removeMessage));
    const isMessageAck = (userType, userId, messagePrefix, key) => redisClient.hExists(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(exist => {
        (0, app_1.log)("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged", userType, userId);
        return !exist;
    }).catch(getRejectError(isMessageAck, userType + " " + userId + ", " + messagePrefix + " " + key));
    const addConnectedUser = (userType, id) => {
        const setConnectedUser = (firstTime, id) => __awaiter(void 0, void 0, void 0, function* () {
            const date = Date.now();
            return redisClient.hSetNX(getConnectedUsersHashKey(userType), id.toString(), date.toString()).then(added => {
                if (added) {
                    (0, app_1.log)((firstTime ? "first time " : "") + "added to connected hash", userType, id);
                    return { id: id, date: date };
                }
                else {
                    return Promise.reject(userType + " " + id + " was not added to connected hash");
                }
            });
        });
        let promise;
        if (userType === "host") {
            promise = setConnectedUser(false, id);
        }
        else {
            promise = (id === undefined ? redisClient.incr(guessCountKey).then(newGuessId => [newGuessId, true]) : Promise.resolve([id, false])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId));
        }
        return promise.catch(getRejectError(addConnectedUser));
    };
    const removeConnectedUser = (userType, id) => {
        return redisClient.hDel(getConnectedUsersHashKey(userType), id.toString()).then(n => {
            if (n > 0)
                (0, app_1.log)("was removed from connected hash", userType, id);
            else
                return Promise.reject(userType + " " + id + " was not removed from connected hash");
        }).catch(getRejectError(removeConnectedUser));
    };
    const getConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host";
        return redisClient.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields);
            const usersConnectedNumber = fieldsEntries.length;
            const areUsersConnected = fieldsEntries.length > 0;
            (0, app_1.log)((areUsersConnected ? usersConnectedNumber : "no") + " " + ofUserType + " in connected hash: " + (areUsersConnected ? fieldsEntries.toString() : ""), toUserType, toUserId);
            const users = {};
            fieldsEntries.forEach(([idStr, dateStr]) => { users[+idStr] = +dateStr; });
            return users;
        }).catch(getRejectError(getConnectedUsers));
    };
    const redisClient = initConnection(handleOnError, handleOnReady);
    // delete all the data
    //redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))
    return { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck };
};
exports.initRedis = initRedis;
