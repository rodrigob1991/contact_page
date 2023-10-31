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
exports.initRedisConnection = exports.redisErrorCauses = void 0;
const constants_1 = require("chat-common/src/model/constants");
const functions_1 = require("chat-common/src/message/functions");
const app_1 = require("./app");
const logs_1 = require("./logs");
const redis_1 = require("redis");
const redis_2 = require("./errors/redis");
exports.redisErrorCauses = {
    addConnectedUser: { alreadyConnected: "alreadyConnected" },
    removeConnectedUser: {},
    getConnectedUsers: {},
    cacheMessage: { wasNotCached: "wasNotCached" },
    removeMessage: {},
    isMessageAck: {},
    publishMessage: {},
    getCachedMessages: {},
    handleUserSubscriptionToMessages: {}
};
const connect = (handleOnError, handleOnConnect, handleOnReconnecting, handleOnReady, handleOnConnectError) => {
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
    client.on("error", handleOnError);
    client.on("connect", handleOnConnect);
    client.on("reconnecting", handleOnReconnecting);
    client.on("ready", handleOnReady);
    client.connect().catch(handleOnConnectError);
    return client;
};
const initRedisConnection = (handleOnError, handleOnConnect, handleOnReconnecting, handleOnReady, handleOnConnectError) => {
    const guessCountKey = constants_1.userTypes.guess + "-count";
    const connectedUsersHashKeyPrefix = "connected:";
    const connectedHostsHashKey = connectedUsersHashKeyPrefix + constants_1.userTypes.host;
    const connectedGuessesHashKey = connectedUsersHashKeyPrefix + constants_1.userTypes.guess;
    const getConnectedUsersHashKey = (userType) => userType === "host" ? connectedHostsHashKey : connectedGuessesHashKey;
    const getMessagesHashKey = (userType, userId, messagePrefix) => userType + ":" + userId + ":" + messagePrefix + ":messages";
    const getRejectError = (functionName, userType, userId, info) => (cause) => Promise.reject(new redis_2.RedisError(functionName, cause, userType, userId, info));
    const getConDisChannel = (userType) => constants_1.messagePrefixes.con + ":" + constants_1.messagePrefixes.dis + ":" + userType;
    const getMesUackChannel = (userType, userId) => constants_1.messagePrefixes.mes + ":" + constants_1.messagePrefixes.uack + ":" + userType + ":" + userId;
    const handleUserSubscriptionToMessages = (ofUserType, ofUserId, sendMessage) => {
        const subscriber = client.duplicate();
        const handleConsumedMessage = (cache, message) => __awaiter(void 0, void 0, void 0, function* () {
            yield sendMessage(cache, message);
        });
        const getHandleConsumedMessageError = (message) => (0, app_1.getHandleError)(handleConsumedMessage, "consuming message: " + message);
        const subscribe = () => subscriber.connect().then(() => Promise.all([
            subscriber.subscribe(getConDisChannel(ofUserType), (m) => {
                handleConsumedMessage(true, m).catch(getHandleConsumedMessageError(m));
            }),
            subscriber.subscribe(getMesUackChannel(ofUserType, ofUserId), (m) => {
                handleConsumedMessage(false, m).catch(getHandleConsumedMessageError(m));
            })
        ])
            .then(() => {
            (0, logs_1.log)("subscribed to the channels", ofUserType, ofUserId);
        }))
            .catch(getRejectError("handleUserSubscriptionToMessages", ofUserType, ofUserId, "subscribe"));
        const unsubscribe = () => subscriber.disconnect().then(() => { (0, logs_1.log)("unsubscribed to the channels", ofUserType, ofUserId); }).catch(getRejectError("handleUserSubscriptionToMessages", ofUserType, ofUserId, "unsubscribe"));
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
                channel = getMesUackChannel(toUserType, toUserId);
                break;
        }
        const message = (0, functions_1.getMessage)(parts);
        return client.publish(channel, message)
            .then(n => { (0, logs_1.log)(n + " " + toUserType + " gotten the published message " + message, publisherType, publisherId); })
            .catch(getRejectError("publishMessage", publisherType, publisherId));
    };
    const cacheMessage = (userType, userId, messagePrefix, key, message, connectionUserType, connectionUserId) => client.hSet(getMessagesHashKey(userType, userId, messagePrefix), key, message).then(n => {
        const cached = n > 0;
        const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached";
        if (cached)
            (0, logs_1.log)(msg, connectionUserType, connectionUserId);
        else
            return Promise.reject(exports.redisErrorCauses.cacheMessage.wasNotCached);
    }).catch(getRejectError("cacheMessage", connectionUserType, connectionUserId, messagePrefix + ":" + key + ":" + message));
    const getCachedMessages = (userType, userId, whatPrefixes) => {
        const promises = {};
        for (const prefix in whatPrefixes) {
            promises[prefix] = client.hVals(getMessagesHashKey(userType, userId, prefix))
                .then(messages => {
                const number = messages.length;
                (0, logs_1.log)(number + " " + prefix + " messages cached gotten" + (number > 0 ? ": " + messages.toString() : ""), userType, userId);
                return messages;
            }).catch(getRejectError("getCachedMessages", userType, userId));
        }
        return promises;
    };
    // maybe reject the promise if the message was not removed
    const removeMessage = (userType, userId, messagePrefix, key) => client.hDel(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(n => {
        const removed = n > 0;
        (0, logs_1.log)("message with key " + key + " was " + (removed ? "" : "not ") + "removed", userType, userId);
        return removed;
    }).catch(getRejectError("removeMessage", userType, userId));
    const isMessageAck = (userType, userId, messagePrefix, key) => client.hExists(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(exist => {
        (0, logs_1.log)("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged", userType, userId);
        return !exist;
    }).catch(getRejectError("isMessageAck", userType, userId, messagePrefix + " " + key));
    const addConnectedUser = (type, id) => {
        const setConnectedUser = (firstTime, id) => __awaiter(void 0, void 0, void 0, function* () {
            const date = Date.now();
            return client.hSetNX(getConnectedUsersHashKey(type), id.toString(), date.toString()).then(added => {
                if (added) {
                    (0, logs_1.log)((firstTime ? "first time " : "") + "added to connected hash", type, id);
                    return { id: id, date: date };
                }
                else {
                    return Promise.reject(exports.redisErrorCauses.addConnectedUser.alreadyConnected);
                }
            });
        });
        let promise;
        if (type === "host") {
            promise = setConnectedUser(false, id);
        }
        else {
            promise = (id === undefined ? client.incr(guessCountKey).then(newGuessId => [newGuessId, true]) : Promise.resolve([id, false])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId));
        }
        return promise.catch(getRejectError("addConnectedUser", type, id));
    };
    const removeConnectedUser = (type, id) => {
        return client.hDel(getConnectedUsersHashKey(type), id.toString()).then(n => {
            (0, logs_1.log)("was" + (n === 0 ? " not" : "") + " removed from connected hash", type, id);
        }).catch(getRejectError("removeConnectedUser", type, id));
    };
    const getConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host";
        return client.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields);
            const usersConnectedNumber = fieldsEntries.length;
            const areUsersConnected = fieldsEntries.length > 0;
            (0, logs_1.log)((areUsersConnected ? usersConnectedNumber : "no") + " " + ofUserType + " in connected hash: " + (areUsersConnected ? fieldsEntries.toString() : ""), toUserType, toUserId);
            const users = {};
            fieldsEntries.forEach(([idStr, dateStr]) => { users[+idStr] = +dateStr; });
            return users;
        }).catch(getRejectError("getConnectedUsers", toUserType, toUserId));
    };
    const client = connect(handleOnError, handleOnConnect, handleOnReconnecting, handleOnReady, handleOnConnectError);
    return { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck };
};
exports.initRedisConnection = initRedisConnection;
