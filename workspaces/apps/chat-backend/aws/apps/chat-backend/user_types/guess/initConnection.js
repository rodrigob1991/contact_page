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
exports.initConnection = void 0;
const functions_1 = require("chat-common/src/message/functions");
const app_1 = require("../../app");
const logs_1 = require("../../logs");
const authentication_1 = require("../host/authentication");
const objects_1 = require("utils/src/objects");
const initConnection = ({ id: guessId, name: guessName, date: connectionDate }, setConnectionHandlers, removeConnectedGuess, getConnectedHosts, publishMessage, handleGuessSubscriptionToMessages, getGuessCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const log = (msg) => { (0, logs_1.log)(msg, "guess", guessId); };
    const sendOutboundMessage = (cache, ...messages) => __awaiter(void 0, void 0, void 0, function* () {
        return Promise.all(messages.map(message => {
            const keyPrefix = `guess:${guessId}:`;
            let key = undefined;
            const mp = (0, functions_1.getPrefix)(message);
            switch (mp) {
                case "usrs":
                    key = `${keyPrefix}${(0, functions_1.getCutMessage)(message, { body: 3 }, 3)}`;
                    break;
                case "con":
                    key = `${keyPrefix}${(0, functions_1.getCutMessage)(message, { body: 4 }, 4)}`;
                    break;
                case "dis":
                    key = `${keyPrefix}${(0, functions_1.getCutMessage)(message, { body: 4 }, 4)}`;
                    break;
                case "uack":
                    key = `${keyPrefix}${message}`;
                    break;
                case "mes":
                    key = `${keyPrefix}${(0, functions_1.getCutMessage)(message, { body: 4 }, 4)}`;
                    break;
            }
            return cacheAndSendUntilAck(cache, mp, key, message, guessId);
        })).then();
    });
    const [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(guessId, sendOutboundMessage);
    const handleInboundMessage = (rawData) => {
        const handleInboundMesMessage = (m) => {
            const { number, body, userId: hostId } = (0, functions_1.getParts)(m, { number: 2, userId: 3, body: 4 });
            const outboundToGuessSackMessage = (0, functions_1.getMessage)({ prefix: "sack", number, userId: hostId });
            const outboundToHostMesMessageParts = { prefix: "mes", number, userId: guessId, body };
            const outboundToHostMesMessageKey = `host:${hostId}:mes:${number}:${guessId}`;
            const outboundToHostMesMessage = (0, functions_1.getMessage)(outboundToHostMesMessageParts);
            const publishOutboundToHostMesMessage = () => publishMessage(hostId, outboundToHostMesMessageParts);
            return [outboundToGuessSackMessage, hostId, outboundToHostMesMessageKey, outboundToHostMesMessage, publishOutboundToHostMesMessage];
        };
        const handleInboundAckConMessage = (m) => {
            const { number, userId: hostId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `guess:${guessId}:con:${number}:${hostId}`;
        };
        const handleInboundAckDisMessage = (m) => {
            const { number, userId: hostId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `guess:${guessId}:dis:${number}:${hostId}`;
        };
        const handleInboundAckUsrsMessage = (m) => {
            const { number } = (0, functions_1.getParts)(m, { number: 3 });
            return `guess:${guessId}:usrs:${number}`;
        };
        const handleInboundAckUackMessage = (m) => {
            const { number, userId: hostId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `guess:${guessId}:uack:${number}:${hostId}`;
        };
        const handleInboundAckMesMessage = (m) => {
            const { number, userId: hostId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            const originOutboundMessageKey = `guess:${guessId}:mes:${number}:${hostId}`;
            const outboundToHostUackMessageParts = { prefix: "uack", number, userId: guessId };
            const outboundToHostUackMessageKey = `host:${hostId}:uack:${number}:${guessId}`;
            const outboundToHostUackMessage = (0, functions_1.getMessage)(outboundToHostUackMessageParts);
            const publishOutboundToGuessUackMessage = () => publishMessage(hostId, outboundToHostUackMessageParts);
            return [originOutboundMessageKey, guessId, outboundToHostUackMessageKey, outboundToHostUackMessage, publishOutboundToGuessUackMessage];
        };
        applyHandleInboundMessage(rawData, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, guessId);
    };
    const handleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE GUESS FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        removeConnectedGuess(guessId).catch((0, app_1.getHandleError)(removeConnectedGuess));
        unsubscribe().catch((0, app_1.getHandleError)(unsubscribe));
        publishMessage(undefined, { prefix: "dis", number: Date.now(), userId: guessId, body: guessName }).catch((0, app_1.getHandleError)(publishMessage, "publish disconnection"));
        log(`disconnected, reason code:${reasonCode}, description: ${description}`);
    };
    setConnectionHandlers(handleInboundMessage, handleDisconnection);
    return Promise.all([
        subscribe(),
        // send outbound message if host is connected
        Promise.all([(0, authentication_1.getHosts)(), getConnectedHosts(guessId)]).then(([hosts, connectedHosts]) => !(0, objects_1.isEmpty)(hosts) ? sendOutboundMessage(true, (0, functions_1.getMessage)({
            prefix: "usrs",
            number: connectionDate,
            body: (0, functions_1.getUsersMessageBody)(Object.entries(hosts).map(([id, { name }]) => {
                const isConnected = id in connectedHosts;
                return [+id, name, isConnected, isConnected ? connectedHosts[+id] : undefined];
            }))
        })) : Promise.resolve()),
        ...Object.values(getGuessCachedMessages(guessId, { mes: true, uack: true })).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
        // publish guess connection, maybe do it after the other promises succeed
        publishMessage(undefined, { prefix: "con", number: connectionDate, userId: guessId, body: guessName })
    ])
        .then();
});
exports.initConnection = initConnection;
