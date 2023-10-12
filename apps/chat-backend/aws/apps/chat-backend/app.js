"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const websocket_1 = __importDefault(require("websocket"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_1 = require("packages/chat-common/src/model/constants");
const functions_1 = require("packages/chat-common/src/message/functions");
const strings_1 = require("packages/utils/src/strings");
const redis_1 = require("./redis");
const host_1 = require("./user_specific/host");
const guess_1 = require("./user_specific/guess");
const security_1 = require("packages/utils/src/security");
const log = (msg, userType, id) => { console.log((userType ? (userType + (id === undefined ? "" : " " + id)) + " : " : "") + msg + " : " + new Date()); };
exports.log = log;
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
const hostCookieNamePrefix = constants_1.users.host;
const guessCookieName = constants_1.users.guess;
const getCookiesValues = (cookies, forHost) => {
    let userType = constants_1.users.guess;
    let id;
    const processHostCookie = ({ name, value }) => {
        let found = false;
        if (name.startsWith(hostCookieNamePrefix)) {
            found = true;
            const hostId = name.substring(hostCookieNamePrefix.length);
            switch (hostId) {
                case "1":
                    if (!(0, strings_1.isEmpty)(value) && value === process.env.HOST_1_TOKEN)
                        userType = "host";
                    id = parseInt(hostId);
                    break;
            }
        }
        return found;
    };
    const processGuessCookie = ({ name, value }) => {
        let found = false;
        if (name === guessCookieName) {
            const decryptedId = (0, security_1.decrypt)(process.env.ENCRIPTION_SECRET_KEY, value);
            if (decryptedId.succeed) {
                found = true;
                userType = "guess";
                id = parseInt(decryptedId.output);
            }
        }
        return found;
    };
    const processCookie = forHost ? processHostCookie : processGuessCookie;
    let index = 0;
    while (index < cookies.length && !processCookie(cookies[index])) {
        index++;
    }
    return [userType, id];
};
const newGuessCookies = (guessId) => {
    const cookies = [];
    if (guessId !== undefined) {
        cookies.push({
            name: guessCookieName,
            value: (0, security_1.encrypt)(process.env.ENCRIPTION_SECRET_KEY, guessId.toString()),
            path: constants_1.paths.guess,
            secure: true,
            // @ts-ignore. this attribute is not part of the type, but will be include at runtime
            samesite: "none",
            // roughly one year
            maxage: 60 * 60 * 24 * 30 * 12
        });
    }
    return cookies;
};
const newHostCookies = () => {
    return [];
};
const originIsAllowed = (origin) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    return allowedOrigin !== undefined ? origin.startsWith(allowedOrigin) : true;
};
const handleRequest = (request, { addConnectedUser, removeConnectedUser, getConnectedUsers, publishMessage, handleUserSubscriptionToMessages, cacheMessage, getCachedMessages, removeMessage, isMessageAck }) => {
    const origin = request.origin;
    if (!originIsAllowed(origin)) {
        request.reject();
        (0, exports.log)(`connection from origin ${origin} rejected.`);
    }
    else {
        const [userType, cookieUserId] = getCookiesValues(request.cookies, request.httpRequest.url === constants_1.paths.host);
        const oppositeUserType = userType === "host" ? "guess" : "host";
        let connection;
        const acceptConnection = (accept, him, hd, reason, userId) => {
            if (accept) {
                const cookies = userType === "host" ? newHostCookies() : newGuessCookies(userId);
                (0, exports.log)("cookies: " + JSON.stringify(cookies), userType, userId);
                connection = request.accept(undefined, origin, cookies);
                connection.on("message", him);
                connection.on("close", hd);
                (0, exports.log)("connection accepted", userType, cookieUserId !== null && cookieUserId !== void 0 ? cookieUserId : userId);
            }
            else {
                request.reject(412, reason);
                (0, exports.log)(" connection was rejected," + reason, userType, cookieUserId !== null && cookieUserId !== void 0 ? cookieUserId : userId);
            }
        };
        const closeConnection = (reason) => {
            connection.close(websocket_1.default.connection.CLOSE_REASON_GOING_AWAY, reason);
        };
        const cacheAndSendUntilAck = (cache, messagePrefix, key, message, userId) => {
            const sendUntilAck = () => {
                if (connection.connected) {
                    connection.sendUTF(message);
                    (0, exports.log)("sent outbound message " + message, userType, userId);
                    setTimeout(() => {
                        //CONSIDER IF THIS FAIL AND THE MESSAGE IS NOT RECEIVED
                        isMessageAck(userType, userId, messagePrefix, key).then(ack => {
                            if (!ack) {
                                sendUntilAck();
                            }
                        });
                    }, 5000);
                }
            };
            return (cache ? cacheMessage(userType, userId, messagePrefix, key, message) : Promise.resolve()).then(sendUntilAck);
        };
        const applyHandleInboundMessage = (wsMessage, handleMesMessage, handleAckMessage, userId) => {
            const catchError = (reason) => { (0, exports.log)("error handling inbound message, " + reason, userType, userId); };
            const message = wsMessage.utf8Data;
            const prefix = (0, functions_1.getMessagePrefix)(message);
            switch (prefix) {
                case "mes": {
                    const [outboundSackMessage, oppositeUserId, outboundMesMessageKey, outboundMesMessage, publishOutboundMesMessage] = handleMesMessage(message);
                    publishOutboundMesMessage().catch(catchError);
                    // only send outbound sack message when the outbound mes message is cache
                    cacheMessage(oppositeUserType, oppositeUserId, "mes", outboundMesMessageKey, outboundMesMessage).then(() => connection.sendUTF(outboundSackMessage)).catch(catchError);
                    break;
                }
                case "uack": {
                    const [originOutboundMessagePrefix, originOutboundMessageKey, oppositeUserId, outboundUackMessageKey, outboundUackMessage, publishOutboundUackMessage] = handleAckMessage(message);
                    const removeOriginMessage = () => removeMessage(userType, userId, originOutboundMessagePrefix, originOutboundMessageKey).catch(catchError);
                    if (outboundUackMessageKey) {
                        publishOutboundUackMessage().catch(catchError);
                        // this is when a user ack a mes message
                        // i only remove the outbound mes message if the outbound uack message published to the sender is cache, so to ensure the sender will know that his was received
                        // if cache fail the outbound mes message will continue being send and has to be ack again, repeating this process
                        cacheMessage(oppositeUserType, oppositeUserId, "uack", outboundUackMessageKey, outboundUackMessage).then(removeOriginMessage);
                    }
                    else {
                        // the user ack a con dis or uack message
                        removeOriginMessage();
                    }
                    break;
                }
            }
            (0, exports.log)("inbound message " + message, userType, userId);
        };
        if (userType === constants_1.users.host) {
            (0, host_1.initHostConnection)(acceptConnection, closeConnection, () => addConnectedUser("host", cookieUserId), (hostId) => removeConnectedUser("host", hostId), (toHostId) => getConnectedUsers("host", toHostId), (guessId, mp) => publishMessage("guess", guessId, mp), (hostId, sm) => handleUserSubscriptionToMessages("host", hostId, sm), (hi, wp) => getCachedMessages("host", hi, wp), cacheAndSendUntilAck, (wsm, himm, hiam) => { applyHandleInboundMessage(wsm, himm, hiam, cookieUserId); });
        }
        else {
            (0, guess_1.initGuessConnection)(acceptConnection, closeConnection, () => addConnectedUser("guess", cookieUserId), (guessId) => removeConnectedUser("guess", guessId), (toGuessId) => getConnectedUsers("guess", toGuessId), (hostId, mp) => publishMessage("host", hostId, mp), (guessId, sm) => handleUserSubscriptionToMessages("guess", guessId, sm), (gi, wp) => getCachedMessages("guess", gi, wp), cacheAndSendUntilAck, applyHandleInboundMessage);
        }
    }
};
const initWebSocket = (httpServer, redisApis) => {
    const wsServer = new websocket_1.default.server({
        httpServer: httpServer,
        autoAcceptConnections: false,
    });
    wsServer.on("request", (r) => { handleRequest(r, redisApis); });
};
dotenv_1.default.config();
initWebSocket(initHttpServer(), (0, redis_1.initRedis)());
