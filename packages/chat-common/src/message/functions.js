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
const getMessagePrefix = (m) => {
    return m.substring(0, 3);
};
exports.getMessagePrefix = getMessagePrefix;
const getMessageParts = (m, whatGet) => {
    const parts = {};
    const getPartSeparatorIndex = (occurrence) => (0, strings_1.getIndexOnOccurrence)(m, ":", occurrence);
    let firstSeparatorIndex;
    let finalSeparatorIndex;
    if (constants_1.messageParts.prefix in whatGet)
        parts["prefix"] = m.substring(0, 3);
    if (constants_1.messageParts.originPrefix in whatGet)
        parts["originPrefix"] = m.substring(4, 7);
    if (constants_1.messageParts.number in whatGet) {
        const numberPosition = whatGet.number;
        firstSeparatorIndex = getPartSeparatorIndex(numberPosition - 1);
        finalSeparatorIndex = getPartSeparatorIndex(numberPosition);
        parts["number"] = parseInt(m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex));
    }
    if (constants_1.messageParts.guessId in whatGet) {
        const guessIdPosition = whatGet.guessId;
        firstSeparatorIndex = getPartSeparatorIndex(guessIdPosition - 1);
        finalSeparatorIndex = getPartSeparatorIndex(guessIdPosition);
        parts["guessId"] = parseInt(m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex));
    }
    if (constants_1.messageParts.body in whatGet) {
        firstSeparatorIndex = getPartSeparatorIndex(whatGet.body - 1);
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
    let partStartIndex = 0;
    let partEndIndex = 0;
    const findPartIndex = (start = true) => {
        const currentPosition = position - cutCount;
        let index;
        if (currentPosition === 1 && start) {
            index = 0;
        }
        else if (start) {
            index = (0, strings_1.getIndexOnOccurrence)(cutMessage, ":", currentPosition - 1) + 1;
        }
        else {
            index = position === lastPosition ? cutMessage.length : (0, strings_1.getIndexOnOccurrence)(cutMessage, ":", currentPosition) - 1;
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
    if (constants_1.messageParts.prefix in whatCut) {
        position = 1;
        partEndIndex = 2;
        cut();
    }
    if (constants_1.messageParts.originPrefix in whatCut) {
        position = 2;
        partStartIndex = 4 - cutSize;
        partEndIndex = 6 - cutSize;
        cut();
    }
    if (constants_1.messageParts.number in whatCut) {
        position = whatCut.number;
        partStartIndex = findPartIndex();
        partEndIndex = findPartIndex(false);
        cut();
    }
    if (constants_1.messageParts.guessId in whatCut) {
        position = whatCut.guessId;
        partStartIndex = findPartIndex();
        partEndIndex = findPartIndex(false);
        cut();
    }
    if (constants_1.messageParts.body in whatCut) {
        position = whatCut.body;
        partStartIndex = findPartIndex();
        partEndIndex = cutMessage.length;
        cut();
    }
    return cutMessage;
};
exports.getCutMessage = getCutMessage;
