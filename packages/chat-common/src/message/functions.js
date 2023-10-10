"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParsedUsersMessageBody = exports.getUsersMessageBody = exports.getCutMessage = exports.getParts = exports.getOriginPrefix = exports.getPrefix = exports.getMessage = void 0;
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
    if (constants_1.messageParts.userId in parts)
        message += ":" + parts.userId;
    if (constants_1.messageParts.body in parts)
        message += ":" + parts.body;
    return message;
};
exports.getMessage = getMessage;
const getPartSeparatorIndex = (message, occurrence) => (0, strings_1.getIndexOnOccurrence)(message, ":", occurrence);
const getPrefix = (m) => m.substring(0, getPartSeparatorIndex(m, 1));
exports.getPrefix = getPrefix;
const getOriginPrefix = (m) => m.substring(getPartSeparatorIndex(m, 1) + 1, getPartSeparatorIndex(m, 2));
exports.getOriginPrefix = getOriginPrefix;
const getParts = (m, whatGet) => {
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
        parts["number"] = +m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex);
    }
    if (constants_1.messageParts.userId in whatGet) {
        const guessIdPosition = whatGet.userId;
        firstSeparatorIndex = getPartSeparatorIndex(m, guessIdPosition - 1);
        finalSeparatorIndex = getPartSeparatorIndex(m, guessIdPosition);
        parts["userId"] = +m.substring(firstSeparatorIndex + 1, finalSeparatorIndex < 0 ? m.length : finalSeparatorIndex);
    }
    if (constants_1.messageParts.body in whatGet) {
        firstSeparatorIndex = getPartSeparatorIndex(m, whatGet.body - 1);
        parts["body"] = m.substring(firstSeparatorIndex + 1, m.length);
    }
    return parts;
};
exports.getParts = getParts;
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
        const cutStartIndex = partStartIndex - (position === lastPosition ? 1 : 0);
        const cutEndIndex = partEndIndex + (position === lastPosition ? 0 : 2);
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
    if (constants_1.messageParts.userId in whatCut) {
        position = whatCut.userId;
        cut();
    }
    if (constants_1.messageParts.body in whatCut) {
        position = whatCut.body;
        cut(undefined, cutMessage.length);
    }
    return cutMessage;
};
exports.getCutMessage = getCutMessage;
const usersSeparator = ",";
const userDataSeparator = ":";
const getUsersMessageBody = (usersData) => {
    let str = "";
    usersData.forEach(([id, name, isConnected, date]) => str += `${id}${userDataSeparator}${name}${userDataSeparator}${isConnected ? "1" : "0"}${userDataSeparator}${date !== null && date !== void 0 ? date : ""}${usersSeparator}`);
    return str.substring(0, str.length - 1);
};
exports.getUsersMessageBody = getUsersMessageBody;
const getParsedUsersMessageBody = (body) => (0, strings_1.recursiveSplit)(body, [usersSeparator, userDataSeparator]).map(userData => ({
    id: +userData[0],
    name: userData[1],
    isConnected: userData[2] === "1",
    date: +userData[3]
}));
exports.getParsedUsersMessageBody = getParsedUsersMessageBody;
