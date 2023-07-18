"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = void 0;
const constants_1 = require("chat-common/src/model/constants");
const functions_1 = require("chat-common/src/message/functions");
const app_1 = require("./app");
const redis_1 = require("redis");
const initConnection = () => {
    const url = process.env.REDIS_URL;
    const credentials = { username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD };
    const socket = { tls: process.env.REDIS_TLS !== undefined };
    const client = process.env.REDIS_CLUSTER !== undefined ?
        (0, redis_1.createCluster)({
            rootNodes: [{
                    url
                }],
            defaults: {
                socket
            }
        }) :
        (0, redis_1.createClient)(Object.assign(Object.assign({ url }, credentials), { socket }));
    client.on('error', (err) => {
        (0, app_1.log)(err);
    });
    client.on('connect', () => {
        (0, app_1.log)('connected with redis');
    });
    client.on('reconnecting', () => {
        (0, app_1.log)('reconnecting with redis');
    });
    client.on('ready', () => {
        (0, app_1.log)('redis is ready');
    });
    client.connect();
    return client;
};
const initRedis = () => {
    const guessCountKey = constants_1.users.guess + "-count";
    const connectedHostsHashKey = "connected:host";
    const connectedGuessesHashKey = "connected:guesses";
    const getConnectedUsersHashKey = (userType) => userType === "host" ? connectedHostsHashKey : connectedGuessesHashKey;
    const getMessagesHashKey = (userType, userId, messagePrefix) => userType + ":" + userId + ":" + messagePrefix + ":messages";
    const getHandleError = (fn) => (reason) => Promise.reject("redis error: " + fn.name + " failed, " + reason);
    const getConDisChannel = (isHostUser) => constants_1.messagePrefixes.con + ":" + constants_1.messagePrefixes.dis + ":" + (isHostUser ? constants_1.users.host : constants_1.users.guess);
    const getMessagesChannel = (isHostUser, userId) => constants_1.messagePrefixes.mes + ":" + (isHostUser ? constants_1.users.host : constants_1.users.guess) + ":" + userId;
    const handleUserSubscriptionToMessages = (ofUserType, ofUserId, sendMessage) => {
        const isHostUser = ofUserType === constants_1.users.host;
        const subscriber = redisClient.duplicate();
        const logErrorSendMessage = (message, reason) => { (0, app_1.log)("could not send message " + message + ", " + reason, ofUserType, ofUserId); };
        const subscribe = () => subscriber.connect().then(() => Promise.all([subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
                // @ts-ignore
                sendMessage(true, message).catch((r) => { logErrorSendMessage(message, r); });
            }),
            subscriber.subscribe(getMessagesChannel(isHostUser, ofUserId), (message, channel) => {
                // @ts-ignore
                sendMessage(false, message).catch((r) => { logErrorSendMessage(message, r); });
            })])
            .then(() => {
            (0, app_1.log)("subscribed to the channels", ofUserType, ofUserId);
        }))
            .catch(getHandleError(subscribe));
        const unsubscribe = () => subscriber.disconnect().then(() => (0, app_1.log)("unsubscribed to the channels", ofUserType, ofUserId)).catch(getHandleError(unsubscribe));
        return [subscribe, unsubscribe];
    };
    const publishMessage = (toUserType, toUserId, parts) => {
        let channel;
        const isToHostUser = toUserType === constants_1.users.host;
        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(isToHostUser);
                break;
            case "mes":
            case "uack":
                channel = getMessagesChannel(isToHostUser, toUserId);
                break;
            default:
                throw new Error("y" +
                    "should have been enter any case");
        }
        const message = (0, functions_1.getMessage)(parts);
        return redisClient.publish(channel, message)
            .then(n => { (0, app_1.log)(n + " " + toUserType + " gotten the published message " + message, isToHostUser ? "guess" : "host", parts.userId); })
            .catch(getHandleError(publishMessage));
    };
    const cacheMessage = (userType, userId, messagePrefix, key, message) => redisClient.hSet(getMessagesHashKey(userType, userId, messagePrefix), key, message).then(n => {
        const cached = n > 0;
        const msg = "message " + message + " with key " + key + " was " + (cached ? "" : "not ") + "cached";
        if (cached)
            (0, app_1.log)(msg, userType, userId);
        else
            return Promise.reject(userType + " : " + userId + " : " + msg);
    }).catch(getHandleError(cacheMessage));
    const getCachedMessages = (userType, userId, whatPrefixes) => {
        const promises = {};
        for (const prefix in whatPrefixes) {
            promises[prefix] = redisClient.hVals(getMessagesHashKey(userType, userId, prefix))
                .then(messages => {
                const number = messages.length;
                (0, app_1.log)(number + " " + prefix + " messages cached gotten" + (number > 0 ? ": " + messages : ""), userType, userId);
                return messages;
            }).catch(getHandleError(getCachedMessages));
        }
        return promises;
    };
    // maybe reject the promise if the message was not removed
    const removeMessage = (userType, userId, messagePrefix, key) => redisClient.hDel(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(n => {
        const removed = n > 0;
        (0, app_1.log)("message with key " + key + " was " + (removed ? "" : "not ") + "removed", userType, userId);
        return removed;
    }).catch(getHandleError(removeMessage));
    const isMessageAck = (userType, userId, messagePrefix, key) => redisClient.hExists(getMessagesHashKey(userType, userId, messagePrefix), key)
        .then(exist => {
        (0, app_1.log)("message with key " + key + " was" + (exist ? " not" : "") + " acknowledged", userType, userId);
        return !exist;
    }).catch(getHandleError(isMessageAck));
    const addConnectedUser = (userType, id) => {
        const setConnectedUser = (firstTime, id) => {
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
        };
        let promise;
        if (userType === "host") {
            promise = setConnectedUser(false, id);
        }
        else {
            promise = (id === undefined ? redisClient.incr(guessCountKey).then(newGuessId => [newGuessId, true]) : Promise.resolve([id, false])).then(([guessId, firstTime]) => setConnectedUser(firstTime, guessId));
        }
        return promise.catch(getHandleError(addConnectedUser));
    };
    const removeConnectedUser = (userType, id) => {
        return redisClient.hDel(getConnectedUsersHashKey(userType), id.toString()).then(n => {
            if (n > 0)
                (0, app_1.log)("was removed from connected hash", userType, id);
            else
                return Promise.reject(userType + " " + id + " was not removed from connected hash");
        }).catch(getHandleError(removeConnectedUser));
    };
    const getConnectedUsers = (toUserType, toUserId) => {
        const ofUserType = toUserType === "host" ? "guess" : "host";
        return redisClient.hGetAll(getConnectedUsersHashKey(ofUserType)).then(fields => {
            const fieldsEntries = Object.entries(fields);
            const usersConnectedNumber = fieldsEntries.length;
            const areUsersConnected = fieldsEntries.length > 0;
            (0, app_1.log)((areUsersConnected ? usersConnectedNumber : "no") + " " + ofUserType + " in connected hash: " + (areUsersConnected ? fieldsEntries : ""), toUserType, toUserId);
            return fieldsEntries.map(([idStr, dateStr]) => [+idStr, +dateStr]);
        }).catch(getHandleError(getConnectedUsers));
    };
    const redisClient = initConnection();
    // delete all the data
    //redisClient.flushAll().then((r) => log("all redis data deleted, reply: " + r))
    return { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck };
};
exports.initRedis = initRedis;
