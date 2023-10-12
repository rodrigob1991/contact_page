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
exports.getHandleError = exports.logError = exports.log = exports.panic = void 0;
const websocket_1 = __importDefault(require("websocket"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_1 = require("chat-common/src/model/constants");
const functions_1 = require("chat-common/src/message/functions");
const redis_1 = require("./redis");
const initConnection_1 = require("./user_types/host/initConnection");
const initConnection_2 = require("./user_types/guess/initConnection");
const cookies_1 = require("./user_types/host/cookies");
const cookies_2 = require("./user_types/guess/cookies");
const getStandardMessage = (msg, userType, userId) => (userType ? (userType + (userId === undefined ? "" : " " + userId)) + " : " : "") + msg + " : " + new Date().toString();
const panic = (msg, userType, userId) => {
    throw new Error(getStandardMessage(msg, userType, userId));
};
exports.panic = panic;
const log = (msg, userType, userId) => { console.log(getStandardMessage(msg, userType, userId)); };
exports.log = log;
const logError = (msg, userType, userId) => { console.error(getStandardMessage(msg, userType, userId)); };
exports.logError = logError;
// THIS RETURN THE HANDLER FOR THE ERRORS LIKE THOSE THAT OCCURS IN CALLBACKS OF THE CONNECTIONS
// ONY USE IT WHEN THE ERROR DOES NOT NEED TO PROPAGATE
// COULD BE A CENTRALIZE PLACE TO HANDLE THOSE ERRORS, FIND OUT
const getHandleError = (originFunction, reason2, userType, userId, callback) => (reason1) => {
    (0, exports.logError)("error on: " + originFunction.name + ", " + (reason2 !== undefined ? reason2 + ", " : "") + reason1, userType, userId);
    if (callback)
        callback(reason1);
};
exports.getHandleError = getHandleError;
const initHttpServer = () => {
    const httpServer = http_1.default.createServer((request, response) => {
        response.writeHead(404);
        response.end();
    });
    httpServer.listen(process.env.PORT, () => {
        (0, exports.log)("http server is listening on port " + process.env.PORT);
    });
    return httpServer;
};
/*const getCookiesData = async (cookies: CookiesIn, forHost: boolean): Promise<[UserType, number | undefined]> => {
    let userType: UserType = users.guess
    let id




    let userCommonData = emptyUser
    const extractUserData = forHost ? extractHostData : extractGuessData

    let index = 0
    while (index < cookies.length &&  !user) {
        user = await extractUserData(cookies[index])
        index++
    }
    //return {type:
}*/
const originIsAllowed = (origin) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    return allowedOrigin !== undefined ? origin.startsWith(allowedOrigin) : true;
};
const handleRequest = (request, { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck }) => __awaiter(void 0, void 0, void 0, function* () {
    const origin = request.origin;
    if (!originIsAllowed(origin)) {
        request.reject();
        (0, exports.log)(`connection from origin ${origin} rejected.`);
    }
    else {
        let userType;
        let userData;
        let getCookies;
        if (request.httpRequest.url === constants_1.paths.host) {
            userType = "host";
            userData = yield (0, cookies_1.extractHostData)(request.cookies);
            getCookies = cookies_1.getHostCookies;
        }
        else {
            userType = "guess";
            userData = yield (0, cookies_2.extractGuessData)(request.cookies);
            getCookies = cookies_2.getGuessCookies;
        }
        const oppositeUserType = userType === "host" ? "guess" : "host";
        let connection;
        const acceptConnection = (him, hd, userId) => {
            const cookies = getCookies(userId);
            (0, exports.log)("cookies: " + JSON.stringify(cookies), userType, userId);
            connection = request.accept(undefined, origin, cookies);
            connection.on("message", him);
            connection.on("close", hd);
            (0, exports.log)("connection accepted", userType, userId);
        };
        /*const closeConnection: CloseConnection = (reason) => {
            connection.close(ws.connection.CLOSE_REASON_GOING_AWAY, reason)
        }*/
        const cacheAndSendUntilAck = (cache, messagePrefix, key, message, userId) => __awaiter(void 0, void 0, void 0, function* () {
            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message);
                    (0, exports.log)("sent outbound message " + message, userType, userId);
                    setTimeout(() => {
                        // consider when the connection with redis fail
                        // to continue sending the message pass a callback to getHandleError that call sendUntilAck
                        isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                            if (!ack) {
                                sendUntilAck();
                            }
                        }).catch((0, exports.getHandleError)(sendUntilAck, undefined, userType, userId));
                    }, 5000);
                }
            };
            return (cache ? cacheMessage(userType, userId, messagePrefix, key, message) : Promise.resolve()).then(sendUntilAck);
        });
        const applyHandleInboundMessage = (wsMessage, handleMesMessage, handleAckConMessage, handleAckDisMessage, handleAckUsrsMessage, handleAckUackMessage, handleAckMesMessage, userId) => {
            //const catchError = (reason: string) => {log("error handling inbound message, " + reason, userType, userId)}
            const handleError = (0, exports.getHandleError)(applyHandleInboundMessage, undefined, userType, userId);
            const message = wsMessage.utf8Data;
            const prefix = (0, functions_1.getPrefix)(message);
            switch (prefix) {
                case "mes": {
                    const [outboundSackMessage, oppositeUserId, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message);
                    publishOutboundMesMessage().catch(handleError);
                    // only send outbound sack message when the outbound mes message is cache
                    cacheMessage(oppositeUserType, oppositeUserId, "mes", outboundMesMessageKey, outboundMesMessage).then(() => { connection.sendUTF(outboundSackMessage); }).catch(handleError);
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
                            cacheMessage(oppositeUserType, oppositeUserId, "uack", uackMessageKey, uackMessage).then(() => { removeOriginMessage(originMesMessageKey); }).catch(handleError);
                            publishUackMessage().catch(handleError);
                            break;
                    }
                    /*    const [originOutboundMessagePrefix, originOutboundMessageKey, oppositeUserId, outboundUackMessageKey, outboundUackMessage, publishOutboundUackMessage] = handleAckMessage(message as InboundAckMessage["template"])
                        const removeOriginMessage = () => removeMessage(userType, userId, originOutboundMessagePrefix, originOutboundMessageKey).catch(handleError)
                        if (outboundUackMessageKey) {
                            (publishOutboundUackMessage as () => Promise<void>)().catch(handleError)
                            // this is when a user ack a mes message
                            // I only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                            // if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process
                            cacheMessage(oppositeUserType, oppositeUserId, "uack", outboundUackMessageKey, outboundUackMessage as OutboundUserAckMessage["template"]).then(removeOriginMessage)
                        } else {
                            // the user ack a con dis or uack message
                            removeOriginMessage()
                        }
                        break*/
                }
            }
            (0, exports.log)("inbound message " + message, userType, userId);
        };
        yield (() => (userType === constants_1.userTypes.host
            ? (0, initConnection_1.initConnection)(userData, acceptConnection, (hostId) => addConnectedUser("host", hostId), (hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp), (hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, applyHandleInboundMessage)
            : (0, initConnection_2.initConnection)(userData, acceptConnection, (guessId) => addConnectedUser("guess", guessId), (guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId), (hostId, mp) => publishMessage("host", hostId, mp), (guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi, wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage)))();
    }
});
const initWebSocketServer = () => {
    const wsServer = new websocket_1.default.server({
        httpServer: initHttpServer(),
        autoAcceptConnections: false,
    });
    const handleOnRedisError = (error) => {
    };
    const handleOnRedisReady = () => {
    };
    const redisApis = (0, redis_1.initRedis)(handleOnRedisError, handleOnRedisReady);
    wsServer.on("request", (request) => {
        const rejectConnection = () => {
            if (!request._resolved) {
                request.reject();
            }
            else {
                request.socket.end();
            }
        };
        handleRequest(request, redisApis).catch((0, exports.getHandleError)(handleRequest, undefined, undefined, undefined, rejectConnection));
    });
};
dotenv_1.default.config();
initWebSocketServer();
