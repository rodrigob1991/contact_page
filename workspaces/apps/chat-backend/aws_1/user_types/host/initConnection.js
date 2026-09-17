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
const objects_1 = require("utils/src/objects");
//const logError = (msg: string, id: number) => { appLogError(msg, "host", id) }
const initConnection = ({ id: hostId, name: hostName }, acceptConnection, addConnectedHost, removeConnectedHost, getConnectedGuesses, publishMessage, handleHostSubscriptionToMessages, getHostCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => __awaiter(void 0, void 0, void 0, function* () {
    const log = (msg) => { (0, app_1.log)(msg, "host", hostId); };
    const panic = (msg) => (0, app_1.panic)(msg, "host", hostId);
    const getHandleError = (originFunction, reason2, callback) => (0, app_1.getHandleError)(originFunction, reason2, "host", hostId, callback);
    const sendOutboundMessage = (cache, ...messages) => __awaiter(void 0, void 0, void 0, function* () {
        const promises = [];
        for (const message of messages) {
            const keyPrefix = `host:${hostId}:`;
            let key;
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
                default:
                    panic("invalid message prefix");
            }
            // @ts-ignore: typescript complain about key is not assign, because it does not consider panic throw an error.
            promises.push(cacheAndSendUntilAck(cache, mp, key, message, hostId));
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then();
    });
    const handleInboundMessage = (m) => {
        const handleInboundMesMessage = (m) => {
            const { number, userId: guessId, body } = (0, functions_1.getParts)(m, { number: 2, userId: 3, body: 4 });
            const outboundToHostSackMessage = (0, functions_1.getMessage)({ prefix: "sack", number, userId: guessId });
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}:${hostId}`;
            const outboundToGuessMesMessageParts = { prefix: "mes", number, userId: hostId, body };
            const outboundToGuessMesMessage = (0, functions_1.getMessage)(outboundToGuessMesMessageParts);
            const publishOutboundToGuessMesMessage = () => publishMessage(guessId, outboundToGuessMesMessageParts);
            return [outboundToHostSackMessage, guessId, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage];
        };
        /*const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
         //userId: guessId
            const {originPrefix, number} = getParts<InboundFromHostAckMessage, "number" | "originPrefix">(a, {originPrefix: 2, number: 3})
            // the key of the original message acknowledge
            const outboundToHostMessageKey = `host:${hostId}:${originPrefix}:${number}:${guessId}` as const
            let outboundToGuessUackMessageKey
            let outboundToGuessUackMessage
            let publishOutboundToGuessUackMessage
            if (originPrefix === messagePrefixes.mes) {
                const uackMessageParts = {prefix: "uack" as const, number, userId: hostId}
                outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}` as const
                outboundToGuessUackMessage = getMessage<OutboundToGuessUserAckMessage>(uackMessageParts)
                publishOutboundToGuessUackMessage = () => publishMessage<OutboundToGuessUserAckMessage>(guessId, uackMessageParts)
            }
            return [originPrefix, outboundToHostMessageKey, guessId, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage]
        }*/
        const handleInboundAckConMessage = (m) => {
            const { number, userId: guessId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `host:${hostId}:con:${number}:${guessId}`;
        };
        const handleInboundAckDisMessage = (m) => {
            const { number, userId: guessId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `host:${hostId}:dis:${number}:${guessId}`;
        };
        const handleInboundAckUsrsMessage = (m) => {
            const { number } = (0, functions_1.getParts)(m, { number: 3 });
            return `host:${hostId}:usrs:${number}`;
        };
        const handleInboundAckUackMessage = (m) => {
            const { number, userId: guessId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            return `host:${hostId}:uack:${number}:${guessId}`;
        };
        const handleInboundAckMesMessage = (m) => {
            const { number, userId: guessId } = (0, functions_1.getParts)(m, { number: 3, userId: 4 });
            const originOutboundMessageKey = `host:${hostId}:mes:${number}:${guessId}`;
            const outboundToGuessUackMessageParts = { prefix: "uack", number, userId: hostId };
            const outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}`;
            const outboundToGuessUackMessage = (0, functions_1.getMessage)(outboundToGuessUackMessageParts);
            const publishOutboundToGuessUackMessage = () => publishMessage(guessId, outboundToGuessUackMessageParts);
            return [originOutboundMessageKey, guessId, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage];
        };
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, hostId);
    };
    const handleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        removeConnectedHost(hostId).catch(getHandleError(removeConnectedHost));
        unsubscribe().catch(getHandleError(unsubscribe));
        publishMessage(undefined, { prefix: "dis", number: Date.now(), userId: hostId, body: hostName }).catch(getHandleError(publishMessage, "publish disconnection"));
        log(`disconnected, reason code:${reasonCode}, description: ${description}`);
    };
    let subscribe;
    let unsubscribe = () => Promise.resolve();
    let connectionDate = -1;
    try {
        connectionDate = (yield addConnectedHost(hostId)).date;
        acceptConnection(handleInboundMessage, handleDisconnection, hostId);
        [subscribe, unsubscribe] = handleHostSubscriptionToMessages(hostId, sendOutboundMessage);
        yield Promise.all([
            subscribe(),
            // send outbound message for each connected guess
            getConnectedGuesses(hostId).then(guessesIds => !(0, objects_1.isEmpty)(guessesIds) ? sendOutboundMessage(true, (0, functions_1.getMessage)({ prefix: "usrs", number: connectionDate, body: (0, functions_1.getUsersMessageBody)(Object.entries(guessesIds).map(([id, date]) => [+id, "guess" + id, true, date])) })) : Promise.resolve()),
            //getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(([guessId, date]) => getMessage<OutboundToHostConMessage>({prefix: "con", number: date, userId: guessId})))),
            ...Object.values(getHostCachedMessages(hostId, { mes: true, uack: true })).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
            // publish host connection, maybe do it after the other promises succeed
            publishMessage(undefined, { prefix: "con", number: connectionDate, userId: hostId, body: hostName })
        ]);
    }
    catch (e) {
        panic("initialization : " + e);
    }
});
exports.initConnection = initConnection;
