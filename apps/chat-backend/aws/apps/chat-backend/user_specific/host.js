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
exports.initHostConnection = void 0;
const functions_1 = require("packages/chat-common/src/message/functions");
const constants_1 = require("packages/chat-common/src/model/constants");
const app_1 = require("../app");
const log = (msg, id) => { (0, app_1.log)(msg, "host", id); };
const initHostConnection = (acceptConnection, closeConnection, addConnectedHost, removeConnectedHost, getConnectedGuesses, publishHostMessage, handleHostSubscriptionToMessages, getHostCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const sendOutboundMessage = (cache, ...messages) => {
        const promises = [];
        for (const message of messages) {
            const keyPrefix = `host:${hostId}:`;
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
            promises.push(cacheAndSendUntilAck(cache, mp, key, message, hostId));
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then(() => { });
    };
    const handleInboundMessage = (m) => {
        const handleInboundMesMessage = (m) => {
            const { number, userId: guessId, body } = (0, functions_1.getMessageParts)(m, { number: 2, userId: 3, body: 4 });
            const outboundToHostSackMessage = (0, functions_1.getMessage)({ prefix: "sack", number, userId: guessId });
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}:${hostId}`;
            const outboundToGuessMesMessageParts = { prefix: "mes", number, userId: hostId, body };
            const outboundToGuessMesMessage = (0, functions_1.getMessage)(outboundToGuessMesMessageParts);
            const publishOutboundToGuessMesMessage = () => publishHostMessage(guessId, outboundToGuessMesMessageParts);
            return [outboundToHostSackMessage, guessId, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage];
        };
        const handleInboundAckMessage = (a) => {
            const { originPrefix, number, userId: guessId } = (0, functions_1.getMessageParts)(a, { originPrefix: 2, number: 3, userId: 4 });
            const outboundToHostMessageKey = `host:${hostId}:${originPrefix}:${number}:${guessId}`;
            let outboundToGuessUackMessageKey;
            let outboundToGuessUackMessage;
            let publishOutboundToGuessUackMessage;
            if (originPrefix === constants_1.messagePrefixes.mes) {
                const uackMessageParts = { prefix: "uack", number, userId: hostId };
                outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}`;
                outboundToGuessUackMessage = (0, functions_1.getMessage)(uackMessageParts);
                publishOutboundToGuessUackMessage = () => publishHostMessage(guessId, uackMessageParts);
            }
            return [originPrefix, outboundToHostMessageKey, guessId, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage];
        };
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage);
    };
    const handleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeConnectedHost(hostId), unsubscribe(), publishHostMessage(undefined, { prefix: "dis", number: Date.now(), userId: hostId })])
            .then(results => { results.forEach(r => { if (r.status === "rejected")
            log("failure on disconnection, " + r.reason, hostId); }); });
        log(`disconnected, reason code:${reasonCode}, description: ${description}`, hostId);
    };
    let subscribe;
    let unsubscribe = () => Promise.resolve();
    let hostId = -1;
    let connectionDate = -1;
    let connectionAccepted = false;
    try {
        ({ id: hostId, date: connectionDate } = yield addConnectedHost());
        acceptConnection(true, handleInboundMessage, handleDisconnection, undefined);
        connectionAccepted = true;
    }
    catch (e) {
        acceptConnection(false, undefined, undefined, "error initializing host : " + e);
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] = handleHostSubscriptionToMessages(hostId, sendOutboundMessage);
            yield Promise.all([
                subscribe(),
                // send outbound message for each connected guess
                getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(([guessId, date]) => (0, functions_1.getMessage)({ prefix: "con", number: date, userId: guessId })))),
                ...Object.values(getHostCachedMessages(hostId, { mes: true, uack: true })).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish host connection
                publishHostMessage(undefined, { prefix: "con", number: connectionDate, userId: hostId })
            ]);
        }
        catch (e) {
            closeConnection("error initializing host : " + e);
        }
});
exports.initHostConnection = initHostConnection;
