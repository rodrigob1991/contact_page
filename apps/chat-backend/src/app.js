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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket_1 = __importDefault(require("websocket"));
const redis_1 = require("redis");
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const Strings_1 = require("utils/src/Strings");
const users = { host: "host", guess: "guess" };
const messageFlows = { in: "in", out: "out" };
const messagePrefixes = { con: "con", dis: "dis", mes: "mes", ack: "ack" };
const messageParts = { prefix: "prefix", originPrefix: "originPrefix", number: "number", guessId: "guessId", body: "body" };
const getMessage = (parts) => {
    let message = "";
    if (messageParts.prefix in parts)
        message += parts.prefix;
    if (messageParts.originPrefix in parts)
        message += ":" + parts.originPrefix;
    if (messageParts.number in parts)
        message += ":" + parts.number;
    if (messageParts.guessId in parts)
        message += ":" + parts.guessId;
    if (messageParts.body in parts)
        message += ":" + parts.body;
    return message;
};
const getMessageParts = (m, whatGet) => {
    const parts = {};
    const getPartSeparatorIndex = (occurrence) => (0, Strings_1.getIndexOnOccurrence)(m, ":", occurrence);
    if (messageParts.prefix in whatGet)
        parts["prefix"] = m.substring(0, 3);
    if (messageParts.originPrefix in whatGet)
        parts["originPrefix"] = m.substring(4, 7);
    if (messageParts.number in whatGet)
        parts["number"] = m.substring(8, getPartSeparatorIndex(whatGet.number));
    if (messageParts.guessId in whatGet) {
        const guessIdPosition = whatGet.guessId;
        parts["guessId"] = m.substring(getPartSeparatorIndex(guessIdPosition - 1) + 1, getPartSeparatorIndex(guessIdPosition));
    }
    if (messageParts.body in whatGet)
        parts["body"] = m.substring(getPartSeparatorIndex(whatGet.body - 1) + 1, m.length - 1);
    return parts;
};
const getCutMessage = (m, whatCut, lastPosition) => {
    let cutMessage = m;
    let position = 0;
    let cutSize = 0;
    let cutCount = 0;
    let partStartIndex = 0;
    let partEndIndex = 0;
    const findPartBoundaryIndex = (start = true) => {
        const currentPosition = position - cutCount;
        let index;
        if (currentPosition === 1 && start) {
            index = 0;
        }
        else if (start) {
            index = (0, Strings_1.getIndexOnOccurrence)(cutMessage, ":", currentPosition - 1) + 1;
        }
        else {
            index = (0, Strings_1.getIndexOnOccurrence)(cutMessage, ":", currentPosition) - 1;
        }
        return index;
    };
    const cut = () => {
        let cutStartIndex = partStartIndex - (position === lastPosition ? 1 : 0);
        let cutEndIndex = partEndIndex + (position === lastPosition ? 0 : 2);
        cutMessage = cutMessage.substring(0, cutStartIndex) + cutMessage.substring(cutEndIndex);
        cutSize += cutEndIndex - cutStartIndex;
        cutCount++;
    };
    if (messageParts.prefix in whatCut) {
        position = 1;
        partEndIndex = 2;
        cut();
    }
    if (messageParts.originPrefix in whatCut) {
        position = 2;
        partStartIndex = 4 - cutSize;
        partEndIndex = 6 - cutSize;
        cut();
    }
    if (messageParts.number in whatCut) {
        position = whatCut.number;
        partStartIndex = 8 - cutSize;
        partEndIndex = findPartBoundaryIndex(false);
        cut();
    }
    if (messageParts.guessId in whatCut) {
        position = whatCut.guessId;
        partStartIndex = findPartBoundaryIndex();
        partEndIndex = findPartBoundaryIndex(false);
        cut();
    }
    if (messageParts.body in whatCut) {
        position = whatCut.body;
        partEndIndex = findPartBoundaryIndex();
        partEndIndex = m.length - 1;
        cut();
    }
    return cutMessage;
};
const initRedisConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, redis_1.createClient)({ url: process.env.URL, username: process.env.REDIS_USERNAME, password: process.env.REDIS_PASSWORD });
    client.on('error', (err) => { console.error(err); });
    client.on('connect', () => { console.log('connected with redis'); });
    client.on('reconnecting', () => { console.log('reconnecting with redis'); });
    client.on('ready', () => { console.log('redis is ready'); });
    try {
        yield client.connect();
    }
    catch (e) {
        console.log(`could not connect with redis:${e}`);
    }
    return client;
});
const initHttpServer = () => {
    const httpServer = http_1.default.createServer((request, response) => {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });
    httpServer.listen(process.env.PORT, () => {
        console.log((new Date()) + 'http server is listening');
    });
    return httpServer;
};
const initWebSocket = (subscribeToMessages, publishMessage, cacheMessage, removeMessage, isMessageAck, newUser, removeUser, getUsers) => {
    const wsServer = new websocket_1.default.server({
        httpServer: initHttpServer(),
        autoAcceptConnections: false
    });
    const originIsAllowed = (origin) => {
        return true;
    };
    wsServer.on("request", (request) => __awaiter(void 0, void 0, void 0, function* () {
        const origin = request.origin;
        const connectionDate = Date.now();
        if (!originIsAllowed(origin)) {
            request.reject();
            console.log(`${connectionDate} connection from origin ${origin} rejected.`);
        }
        else {
            const connection = request.accept("echo-protocol", origin);
            console.log((connectionDate) + " connection accepted");
            const userType = request.httpRequest.headers.host_user === process.env.HOST_USER_SECRET ? users.host : users.guess;
            const guessId = yield newUser(userType);
            const sendMessage = (key, message) => {
                cacheMessage(key, message);
                const resendUntilAck = () => {
                    connection.sendUTF(message);
                    setTimeout(() => {
                        isMessageAck(key).then(is => {
                            if (!is) {
                                resendUntilAck();
                            }
                        });
                    }, 5000);
                };
                resendUntilAck();
            };
            const sendMessageToHost = (...messages) => {
                for (const message of messages) {
                    let key;
                    const mp = getMessageParts(message, { prefix: 1 }).prefix;
                    switch (mp) {
                        case "con":
                        case "dis":
                        case "ack":
                            key = `host:${message}`;
                            break;
                        case "mes":
                            key = `host:${getCutMessage(message, { body: 4 }, 4)}`;
                            break;
                        default:
                            throw new Error("invalid message prefix");
                    }
                    sendMessage(key, message);
                }
            };
            const sendMessageToGuess = (...messages) => {
                for (const message of messages) {
                    let key;
                    const mp = getMessageParts(message, { prefix: 1 }).prefix;
                    switch (mp) {
                        case "con":
                        case "dis":
                        case "ack":
                            key = `guess:${guessId}:${message}`;
                            break;
                        case "mes":
                            key = `guess:${guessId}:${getCutMessage(message, { body: 3 }, 3)}`;
                            break;
                        default:
                            throw new Error("invalid message prefix");
                    }
                    sendMessage(key, message);
                }
            };
            const handleMessage = (wsMessage, handleMesMessage, handleAckMessage) => {
                const message = wsMessage.utf8Data;
                const { prefix } = getMessageParts(message, { prefix: 1 });
                switch (prefix) {
                    case "mes":
                        // @ts-ignore: typescript does not realize that UT is the same type parameter in the function type and in the message
                        handleMesMessage(message);
                        break;
                    case "ack":
                        // @ts-ignore: typescript does not realize that UT is the same type parameter in the function type and in the message
                        handleAckMessage(message);
                        break;
                }
                console.log((new Date()) + " message: " + message);
            };
            const handleMessageFromHost = (m) => {
                const handleMesMessage = (m) => {
                    const { number, guessId: toGuessId, body } = getMessageParts(m, { number: 2, guessId: 3, body: 4 });
                    publishMessage({ prefix: "mes", number: number, body: body }, "guess", toGuessId);
                };
                const handleAckMessage = (a) => {
                    const { originPrefix, number, guessId: fromGuessId } = getMessageParts(a, { originPrefix: 2, number: 3, guessId: 4 });
                    if (originPrefix === messagePrefixes.mes) {
                        publishMessage({ prefix: "ack", number: number }, "guess", fromGuessId);
                    }
                    removeMessage(`host:${originPrefix}:${number}:${fromGuessId}`);
                };
                handleMessage(m, handleMesMessage, handleAckMessage);
            };
            const handleMessageFromGuess = (m) => {
                const handleMesMessage = (m) => {
                    const { number, body } = getMessageParts(m, { number: 2, body: 3 });
                    publishMessage({ prefix: "mes", number: number, guessId: guessId, body: body }, "host", undefined);
                };
                const handleAckMessage = (a) => {
                    const { originPrefix, number } = getMessageParts(a, { originPrefix: 2, number: 3 });
                    removeMessage(`guess:${guessId}:${originPrefix}:${number}`);
                    if (originPrefix === messagePrefixes.mes)
                        publishMessage({ prefix: "ack", number: number, guessId: guessId }, "host", undefined);
                };
                handleMessage(m, handleMesMessage, handleAckMessage);
            };
            const handleHostDisconnection = (reasonCode, description) => {
                console.log(`host disconnected, reason code:${reasonCode}, description: ${description}`);
                publishMessage({ prefix: "dis", number: Date.now() }, "guess", undefined);
                removeUser(undefined);
            };
            const handleGuessDisconnection = (reasonCode, description) => {
                console.log(`guess ${guessId} disconnected, reason code:${reasonCode}, description: ${description}`);
                publishMessage({ prefix: "dis", number: Date.now(), guessId: guessId }, "host", undefined);
                removeUser(guessId);
            };
            if (userType === users.host) {
                subscribeToMessages(sendMessageToHost, "host", undefined);
                publishMessage({ number: Date.now(), prefix: "con" }, "guess", undefined);
                connection.on("message", handleMessageFromHost);
                connection.on("close", handleHostDisconnection);
                getUsers(users.guess).then(guessesIds => sendMessageToHost(...guessesIds.map(guessId => getMessage({ prefix: "con", number: connectionDate, guessId: guessId }))));
            }
            else {
                subscribeToMessages(sendMessageToGuess, "guess", guessId);
                publishMessage({ number: Date.now(), prefix: "con", guessId: guessId }, "host", undefined);
                connection.on("message", handleMessageFromGuess);
                connection.on("close", handleGuessDisconnection);
                getUsers(users.host).then(hostId => { if (hostId.length > 0)
                    sendMessageToGuess(getMessage({ prefix: "con", number: connectionDate })); });
            }
        }
    }));
};
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const redisClient = yield initRedisConnection();
    const storageHostMemberId = "1";
    const getConDisChannel = (isHostUser) => messagePrefixes.con + "-" + messagePrefixes.dis + "-" + (isHostUser ? users.host : users.guess);
    const getMessagesChannel = (isHostUser, guessId) => messagePrefixes.mes + "-" + (isHostUser ? users.host : users.guess + "-" + guessId);
    const subscribeToMessages = (sendMessage, ofUserType, guessId) => __awaiter(void 0, void 0, void 0, function* () {
        const subscriber = redisClient.duplicate();
        yield subscriber.connect();
        const isHostUser = ofUserType === users.host;
        yield subscriber.subscribe(getConDisChannel(isHostUser), (message, channel) => {
            // @ts-ignore
            sendMessage(message);
        });
        yield subscriber.subscribe(getMessagesChannel(isHostUser, guessId), (message, channel) => {
            // @ts-ignore
            sendMessage(message);
        });
    });
    const publishMessage = (parts, toUserType, toGuessId) => {
        let channel;
        const isToHostUser = toUserType === users.host;
        switch (parts.prefix) {
            case "con":
            case "dis":
                channel = getConDisChannel(isToHostUser);
                break;
            case "mes":
            case "ack":
                channel = getMessagesChannel(isToHostUser, toGuessId);
                break;
            default:
                throw new Error("should have been enter any case");
        }
        redisClient.publish(channel, getMessage(parts));
    };
    const cacheMessage = (key, message) => { redisClient.set(key, message); };
    const removeMessage = (key) => { redisClient.del(key); };
    const isMessageAck = (key) => __awaiter(void 0, void 0, void 0, function* () { return (yield redisClient.get(key)) === null; });
    const newUser = (userType) => {
        let promise;
        if (userType === users.host) {
            promise = redisClient.sAdd(users.host, storageHostMemberId);
        }
        else {
            promise = redisClient.incr(users.guess).then(guessesCount => {
                redisClient.sAdd(users.guess, guessesCount + "");
                return guessesCount;
            });
        }
        return promise;
    };
    const removeUser = (guessId) => {
        let key, member;
        if (guessId) {
            key = users.guess;
            member = guessId + "";
        }
        else {
            key = users.host;
            member = storageHostMemberId;
        }
        redisClient.sRem(key, member);
    };
    const getUsers = (userType) => {
        return redisClient.lRange(users[userType], 0, -1).then(ids => ids.map(id => parseInt(id)));
    };
    initWebSocket(subscribeToMessages, publishMessage, cacheMessage, removeMessage, isMessageAck, newUser, removeUser, getUsers);
});
dotenv_1.default.config();
init();
