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
exports.initGuessConnection = void 0;
const functions_1 = require("chat-common/src/message/functions");
const constants_1 = require("chat-common/src/model/constants");
const app_1 = require("../app");
const log = (msg, guessId) => { (0, app_1.log)(msg, "guess", guessId); };
const initGuessConnection = (acceptConnection, closeConnection, addConnectedGuess, removeConnectedGuess, getConnectedHosts, publishGuessMessage, handleGuessSubscriptionToMessages, getGuessCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const sendOutboundMessage = (cache, ...messages) => {
        const promises = [];
        for (const message of messages) {
            const keyPrefix = `guess:${guessId}:`;
            let key;
            const mp = (0, functions_1.getMessagePrefix)(message);
            switch (mp) {
                case "con":
                case "dis":
                case "uack":
                    key = `${keyPrefix}${message}`;
                    break;
                case "mes":
                    key = `${keyPrefix}${(0, functions_1.getCutMessage)(message, { body: 4 }, 4)}`;
                    break;
                default:
                    throw new Error("invalid message prefix");
            }
            promises.push(cacheAndSendUntilAck(cache, mp, key, message, guessId));
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then(() => { });
    };
    const handleInboundMessage = (m) => {
        const handleInboundMesMessage = (m) => {
            const { number, body, userId: hostId } = (0, functions_1.getMessageParts)(m, { number: 2, userId: 3, body: 4 });
            const outboundToGuessSackMessage = (0, functions_1.getMessage)({ prefix: "sack", number, userId: hostId });
            const outboundToHostMesMessageParts = { prefix: "mes", number, userId: guessId, body };
            const outboundToHostMesMessageKey = `host:${hostId}:mes:${number}:${guessId}`;
            const outboundToHostMesMessage = (0, functions_1.getMessage)(outboundToHostMesMessageParts);
            const publishOutboundToHostMesMessage = () => publishGuessMessage(hostId, outboundToHostMesMessageParts);
            return [outboundToGuessSackMessage, hostId, outboundToHostMesMessageKey, outboundToHostMesMessage, publishOutboundToHostMesMessage];
        };
        const handleInboundAckMessage = (a) => {
            const { originPrefix, number, userId: hostId } = (0, functions_1.getMessageParts)(a, { originPrefix: 2, number: 3, userId: 4 });
            const outboundToGuessMessageKey = `guess:${guessId}:${originPrefix}:${number}:${hostId}`;
            let outboundToHostUackMessageKey;
            let outboundToHostUackMessage;
            let publishOutboundToHostUackMessage;
            if (originPrefix === constants_1.messagePrefixes.mes) {
                const outboundToHostUackMessageParts = { prefix: "uack", number, userId: guessId };
                outboundToHostUackMessageKey = `host:${hostId}:uack:${number}:${guessId}`;
                outboundToHostUackMessage = (0, functions_1.getMessage)(outboundToHostUackMessageParts);
                publishOutboundToHostUackMessage = () => publishGuessMessage(hostId, outboundToHostUackMessageParts);
            }
            return [originPrefix, outboundToGuessMessageKey, hostId, outboundToHostUackMessageKey, outboundToHostUackMessage, publishOutboundToHostUackMessage];
        };
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage, guessId);
    };
    const handleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE GUESS FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeConnectedGuess(guessId), unsubscribe(), publishGuessMessage(undefined, { prefix: "dis", number: Date.now(), userId: guessId })])
            .then(results => { results.forEach(r => { if (r.status === "rejected")
            log("failure on disconnection, " + r.reason, guessId); }); });
        log(`disconnected, reason code:${reasonCode}, description: ${description}`, guessId);
    };
    let subscribe;
    let unsubscribe = () => Promise.resolve();
    let guessId = -1;
    let connectionDate = -1;
    let connectionAccepted = false;
    try {
        ({ id: guessId, date: connectionDate } = yield addConnectedGuess());
        acceptConnection(true, handleInboundMessage, handleDisconnection, undefined, guessId);
        connectionAccepted = true;
    }
    catch (e) {
        acceptConnection(false, undefined, undefined, "error initializing guess : " + e, guessId);
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(guessId, sendOutboundMessage);
            yield Promise.all([
                subscribe(),
                // send outbound message if host is connected
                getConnectedHosts(guessId).then(hostsIds => sendOutboundMessage(true, ...hostsIds.map(([hostId, date]) => (0, functions_1.getMessage)({ prefix: "con", number: date, userId: hostId })))),
                ...Object.values(getGuessCachedMessages(guessId, { mes: true, uack: true })).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish guess connection
                publishGuessMessage(undefined, { prefix: "con", number: connectionDate, userId: guessId })
            ]);
        }
        catch (e) {
            closeConnection("error initializing guess : " + e);
        }
});
exports.initGuessConnection = initGuessConnection;
