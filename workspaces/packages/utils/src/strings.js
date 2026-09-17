"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCase = exports.defaultBodyWord = exports.defaultStartWord = exports.upperCaseFirstChar = exports.getNumber = exports.getNumbers = exports.recursiveSplit = exports.getIndexOnOccurrence = exports.isEmpty = exports.getContainedString = void 0;
const regular_expressions_1 = require("./regular_expressions");
const types_checks_1 = require("./types_checks");
const getContainedString = (str, betweenLeft, betweenRight) => {
    let containedString;
    if (betweenLeft && betweenRight) {
        containedString = str.substring(str.indexOf(betweenLeft) + 1, str.indexOf(betweenRight));
    }
    else if (betweenLeft) {
        containedString = str.substring(str.indexOf(betweenLeft) + 1);
    }
    else if (betweenRight) {
        containedString = str.substring(0, str.indexOf(betweenRight));
    }
    else {
        containedString = str;
    }
    return containedString;
};
exports.getContainedString = getContainedString;
const isEmpty = (str) => {
    return str === undefined || str === null || str.trim().length === 0;
};
exports.isEmpty = isEmpty;
const getIndexOnOccurrence = (str, search, occurrence, reverse = false) => {
    let index = reverse ? str.length - 1 : 0;
    let occurrences = 0;
    let found = false;
    const isStringLeft = reverse ? () => index >= 0 : () => index < str.length;
    const updateIndex = reverse ? () => { index--; } : () => { index++; };
    while (!found && isStringLeft()) {
        if (str.startsWith(search, index)) {
            occurrences++;
            if (occurrence === occurrences) {
                found = true;
            }
        }
        updateIndex();
    }
    return found ? index - 1 : -1;
};
exports.getIndexOnOccurrence = getIndexOnOccurrence;
const recursiveSplit = (str, separators) => {
    const finalParts = [];
    const currentParts = str.split(separators[0]);
    const separatorsRest = separators.slice(1);
    if ((0, types_checks_1.isNonEmpty)(separatorsRest)) {
        for (const part of currentParts) {
            finalParts.push((0, exports.recursiveSplit)(part, separatorsRest));
        }
    }
    else {
        finalParts.push(...currentParts);
    }
    return finalParts;
};
exports.recursiveSplit = recursiveSplit;
const getNumbers = (str) => {
    return [...str.matchAll(regular_expressions_1.numberRgx)].map(([numberStr]) => +numberStr);
};
exports.getNumbers = getNumbers;
const getNumber = (str) => {
    const matched = str.match(regular_expressions_1.numberRgx);
    return matched ? +matched : undefined;
};
exports.getNumber = getNumber;
const upperCaseFirstChar = (str) => (str.substring(0, 1).toUpperCase() + str.substring(1));
exports.upperCaseFirstChar = upperCaseFirstChar;
exports.defaultStartWord = ["[A-Z]", "[a-z]"];
exports.defaultBodyWord = ["[a-z]"];
/**
 * @param str the string from which to match the words
 * @param to case type to form the returned string
 * @param [startWord] strings that can be the start of a word, could have rgx format, defaults: "[A-Z]" y "[a-z]"
 * @param [bodyWord] strings that can be the body of a word, could have rgx format, defaults: "[a-z]"
 * @returns words matched from str turned into a string in the "to" param case type format
 */
const toCase = (str, to, startWord = exports.defaultStartWord, bodyWord = exports.defaultBodyWord) => {
    var _a;
    let mapWord;
    let separator;
    switch (to) {
        case "camel":
            mapWord = (word, index) => index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.substring(1);
            separator = "";
            break;
        case "pascal":
            mapWord = (word, index) => word[0].toUpperCase() + word.substring(1);
            separator = "";
            break;
        case "kebab":
            mapWord = (word, index) => word.toLowerCase();
            separator = "-";
            break;
        case "snake":
            mapWord = (word, index) => word.toLowerCase();
            separator = "_";
    }
    return ((_a = str.match(new RegExp(`(${startWord.join("|")})(${bodyWord.join("|")})*`))) !== null && _a !== void 0 ? _a : []).map(mapWord).join(separator);
};
exports.toCase = toCase;
