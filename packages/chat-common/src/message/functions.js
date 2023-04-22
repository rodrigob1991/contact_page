"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCutMessage = exports.getMessageParts = exports.getMessagePrefix = exports.getMessage = void 0;
const constants_1 = require("../model/constants");
const strings_1 = require("utils/src/strings");
const getMessage = (parts) => {
    let message = "";
    if (constants_1.messageParts.prefix in parts)
        message += parts.prefix;
    if (constants_1.messageParts.originPrefix in parts)
        message += ":" + parts.originPrefix;
    if (constants_1.messageParts.number in parts)
        message += ":" + parts.number;
    if (constants_1.messageParts.guessId in parts)
        message += ":" + parts.guessId;
    if (constants_1.messageParts.body in parts)
        message += ":" + parts.body;
    return message;
};
exports.getMessage = getMessage;
const getPartSeparatorIndex = (message, occurrence) => (0, strings_1.getIndexOnOccurrence)(message, ":", occurrence);
const getMessagePrefix = (m) => {
    return m.substring(0, getPartSeparatorIndex(m, 1));
};
exports.getMessagePrefix = getMessagePrefix;
const getMessageParts = (m, whatGet) => {
    const parts = {};
    let firstSeparatorIndex;
    let finalSeparatorIndex;
    if (constants_1.messageParts.prefix in whatGet)
        parts["prefix"] = m.substring(0, getPartSeparatorIndex(m, 1));
    if (constants_1.messageParts.originPrefix in whatGet)
        parts["originPrefix"] = m.substring(getPartSeparatorIndex(m, 1) + 1, getPartSeparatorIndex(m, 2));
    if (constants_1.messageParts.number in whatGet) {
        const numberPosition = whatGet.number;
        firstSeparatorIndex = getPartSeparatorIndex(m, numberPosition - 1);
        finalSeparatorIndex = getPartSeparatorIndex(m, numberPosition);
        parts["number"] = parseInt(m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex));
    }
    if (constants_1.messageParts.guessId in whatGet) {
        const guessIdPosition = whatGet.guessId;
        firstSeparatorIndex = getPartSeparatorIndex(m, guessIdPosition - 1);
        finalSeparatorIndex = getPartSeparatorIndex(m, guessIdPosition);
        parts["guessId"] = parseInt(m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex));
    }
    if (constants_1.messageParts.body in whatGet) {
        firstSeparatorIndex = getPartSeparatorIndex(m, whatGet.body - 1);
        parts["body"] = m.substring(firstSeparatorIndex + 1, m.length);
    }
    return parts;
};
exports.getMessageParts = getMessageParts;
const getCutMessage = (m, whatCut, lastPosition) => {
    let cutMessage = m;
    let position = 0;
    let cutSize = 0;
    let cutCount = 0;
    const findPartIndex = (start = true) => {
        const currentPosition = position - cutCount;
        let index;
        if (currentPosition === 1 && start) {
            index = 0;
        }
        else if (start) {
            index = getPartSeparatorIndex(cutMessage, currentPosition - 1) + 1;
        }
        else {
            index = position === lastPosition ? cutMessage.length : getPartSeparatorIndex(cutMessage, currentPosition) - 1;
        }
        return index;
    };
    const cut = (partStartIndex = findPartIndex(), partEndIndex = findPartIndex(false)) => {
        let cutStartIndex = partStartIndex - (position === lastPosition ? 1 : 0);
        let cutEndIndex = partEndIndex + (position === lastPosition ? 0 : 2);
        cutMessage = cutMessage.substring(0, cutStartIndex) + cutMessage.substring(cutEndIndex);
        cutSize += cutEndIndex - cutStartIndex;
        cutCount++;
    };
    if (constants_1.messageParts.prefix in whatCut) {
        position = 1;
        cut(0);
    }
    if (constants_1.messageParts.originPrefix in whatCut) {
        position = 2;
        cut();
    }
    if (constants_1.messageParts.number in whatCut) {
        position = whatCut.number;
        cut();
    }
    if (constants_1.messageParts.guessId in whatCut) {
        position = whatCut.guessId;
        cut();
    }
    if (constants_1.messageParts.body in whatCut) {
        position = whatCut.body;
        cut(undefined, cutMessage.length);
    }
    return cutMessage;
};
exports.getCutMessage = getCutMessage;
