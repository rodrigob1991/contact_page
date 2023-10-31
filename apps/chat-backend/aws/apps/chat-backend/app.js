"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandleError = void 0;
const ws_1 = __importStar(require("ws"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const versions_1 = require("utils/src/http/versions");
const message_1 = require("utils/src/http/response/message");
const constants_1 = require("chat-common/src/model/constants");
const functions_1 = require("chat-common/src/message/functions");
const redis_1 = require("./redis");
const initConnection_1 = require("./user_types/host/initConnection");
const initConnection_2 = require("./user_types/guess/initConnection");
const attemptConnection_1 = require("./user_types/host/attemptConnection");
const attemptConnection_2 = require("./user_types/guess/attemptConnection");
const cookies_1 = require("utils/src/http/request/headers/cookies");
const cookies_2 = require("utils/src/http/response/headers/cookies");
const authentication_1 = require("./errors/authentication");
const logs_1 = require("./logs");
const app_1 = require("./errors/app");
const redis_2 = require("./errors/redis");
// THIS RETURN THE HANDLER FOR THE ERRORS LIKE THOSE THAT OCCURS IN CALLBACKS OF THE CONNECTIONS
// ONY USE IT WHEN THE ERROR DOES NOT NEED TO PROPAGATE
// COULD BE A CENTRALIZE PLACE TO HANDLE THOSE ERRORS, FIND OUT
const getHandleError = (originFunction, info, callback) => (error) => {
    let userType, userId;
    if (error instanceof app_1.AppError)
        ({ userType, userId } = error);
    (0, logs_1.logError)("from " + originFunction.name + ", " + (info !== undefined ? info + ", " : "") + error.message, userType, userId);
    if (callback)
        callback(error);
};
exports.getHandleError = getHandleError;
const setResponseCookiesEventName = "setResponseCookies";
const originIsAllowed = (origin) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    return (allowedOrigin === undefined) || (origin !== undefined && origin.startsWith(allowedOrigin));
};
const handleUpgrade = (request, socket, head, addConnectedUser, upgradeToWebSocketConnection) => __awaiter(void 0, void 0, void 0, function* () {
    socket.on("error", (0, exports.getHandleError)(handleUpgrade));
    const { origin, cookie: rawRequestCookies } = request.headers;
    if (originIsAllowed(origin)) {
        const userType = request.url === constants_1.paths.host ? "host" : "guess";
        const requestCookies = rawRequestCookies !== undefined ? (0, cookies_1.parseRequestCookies)(rawRequestCookies) : [];
        let connectedUserData;
        let getResponseCookies;
        if (userType === "host") {
            connectedUserData = yield (0, attemptConnection_1.attemptConnection)(requestCookies, (id) => addConnectedUser("host", id));
            getResponseCookies = attemptConnection_1.getResponseCookies;
        }
        else {
            connectedUserData = yield (0, attemptConnection_2.attemptConnection)(requestCookies, (id) => addConnectedUser("guess", id));
            getResponseCookies = attemptConnection_2.getResponseCookies;
        }
        upgradeToWebSocketConnection(request, socket, head, { type: userType, data: connectedUserData }, getResponseCookies(connectedUserData.id));
    }
});
const handleConnection = ({ type: userType, data: userData }, { removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck }, connection) => __awaiter(void 0, void 0, void 0, function* () {
    const oppositeUserType = constants_1.oppositeUserTypes[userType];
    const setConnectionHandlers = (him, hd) => {
        connection.on("message", him);
        connection.on("close", hd);
    };
    const cacheAndSendUntilAck = (cache, messagePrefix, key, message, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const sendUntilAck = () => {
            if (connection.readyState === ws_1.default.OPEN) {
                connection.send(message);
                (0, logs_1.log)("sent outbound message " + message, userType, userId);
                setTimeout(() => {
                    // consider when the connection with redis fail
                    // to continue sending the message pass a callback to getHandleError that call sendUntilAck
                    isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                        if (!ack) {
                            sendUntilAck();
                        }
                    }).catch((0, exports.getHandleError)(sendUntilAck, undefined));
                }, 5000);
            }
        };
        return (cache ? cacheMessage(userType, userId, messagePrefix, key, message, userType, userId) : Promise.resolve()).then(sendUntilAck);
    });
    const applyHandleInboundMessage = (rawData, handleMesMessage, handleAckConMessage, handleAckDisMessage, handleAckUsrsMessage, handleAckUackMessage, handleAckMesMessage, userId) => {
        const handleError = (0, exports.getHandleError)(applyHandleInboundMessage);
        const message = rawData.toString();
        const prefix = (0, functions_1.getPrefix)(message);
        switch (prefix) {
            case "mes": {
                const [outboundSackMessage, oppositeUserId, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message);
                publishOutboundMesMessage().catch(handleError);
                // only send outbound sack message when the outbound mes message is cache
                cacheMessage(oppositeUserType, oppositeUserId, "mes", outboundMesMessageKey, outboundMesMessage, userType, userId).then(() => { connection.send(outboundSackMessage); }).catch(handleError);
                break;
            }
            case "uack": {
                const originPrefix = (0, functions_1.getOriginPrefix)(message);
                const removeOriginMessage = (messageKey) => { removeMessage(userType, userId, originPrefix, messageKey).catch(handleError); };
                switch (originPrefix) {
                    case "con":
                        const originConMessageKey = handleAckConMessage(message);
                        removeOriginMessage(originConMessageKey);
                        break;
                    case "dis":
                        const originDisMessageKey = handleAckDisMessage(message);
                        removeOriginMessage(originDisMessageKey);
                        break;
                    case "usrs":
                        const originUsrsMessageKey = handleAckUsrsMessage(message);
                        removeOriginMessage(originUsrsMessageKey);
                        break;
                    case "uack":
                        const originUackMessageKey = handleAckUackMessage(message);
                        removeOriginMessage(originUackMessageKey);
                        break;
                    case "mes":
                        const [originMesMessageKey, oppositeUserId, uackMessageKey, uackMessage, publishUackMessage] = handleAckMesMessage(message);
                        /*this is when a user ack a mes message
                        I only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process*/
                        cacheMessage(oppositeUserType, oppositeUserId, "uack", uackMessageKey, uackMessage, userType, userId).then(() => { removeOriginMessage(originMesMessageKey); }).catch(handleError);
                        publishUackMessage().catch(handleError);
                        break;
                }
            }
        }
        (0, logs_1.log)("inbound message " + message, userType, userId);
    };
    yield (() => (userType === constants_1.userTypes.host
        ? (0, initConnection_1.initConnection)(userData, setConnectionHandlers, (hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp), (hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, applyHandleInboundMessage)
        : (0, initConnection_2.initConnection)(userData, setConnectionHandlers, (guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId), (hostId, mp) => publishMessage("host", hostId, mp), (guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi, wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage)))();
});
const initWebSocketServer = () => {
    const httpServer = (0, http_1.createServer)();
    const wsServer = new ws_1.WebSocketServer({ noServer: true });
    const handleOnRedisError = (error) => {
        (0, logs_1.log)("redis error: " + error.message);
    };
    const handleOnRedisConnect = () => {
        (0, logs_1.log)("connected with redis");
    };
    const handleOnRedisReconnecting = () => {
        (0, logs_1.log)("reconnecting with redis");
    };
    const handleOnRedisReady = () => {
        (0, logs_1.log)("redis is ready");
    };
    const handleOnRedisConnectError = (error) => {
        (0, logs_1.log)("error connecting with redis: " + error.message);
    };
    const _a = (0, redis_1.initRedisConnection)(handleOnRedisError, handleOnRedisConnect, handleOnRedisReconnecting, handleOnRedisReady, handleOnRedisConnectError), { addConnectedUser } = _a, redisClientApisRest = __rest(_a, ["addConnectedUser"]);
    const upgradeToWebSocketConnection = (request, socket, head, user, cookies) => {
        request.once(setResponseCookiesEventName, (headers) => {
            headers.push(...(0, cookies_2.getResponseCookieHeaders)(...cookies));
        });
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit("connection", ws, user);
        });
    };
    httpServer.on("upgrade", (request, socket, head) => {
        handleUpgrade(request, socket, head, addConnectedUser, upgradeToWebSocketConnection).catch((0, exports.getHandleError)(handleUpgrade, undefined, (error) => {
            let statusCode = 500;
            if (error instanceof authentication_1.AuthenticationError) {
                statusCode = 401;
            }
            else if (error instanceof redis_2.RedisError) {
                if (error.cause === redis_1.redisErrorCauses.addConnectedUser.alreadyConnected)
                    statusCode = 400;
            }
            socket.write((0, message_1.getResponseMessage)(versions_1.versions["1.1"], statusCode));
            socket.destroy();
        }));
    });
    wsServer.on("headers", (responseHeaders, request) => {
        request.emit(setResponseCookiesEventName, responseHeaders);
    });
    wsServer.on("connection", (connection, user) => {
        handleConnection(user, redisClientApisRest, connection).catch((0, exports.getHandleError)(handleConnection, undefined, (error) => {
            connection.terminate();
        }));
    });
    httpServer.listen(process.env.PORT, () => {
        (0, logs_1.log)("http server listening on port " + process.env.PORT);
    });
};
dotenv_1.default.config();
initWebSocketServer();
