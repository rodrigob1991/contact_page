"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNumbers = exports.recursiveSplit = exports.getIndexOnOccurrence = exports.isEmpty = exports.getContainedString = void 0;
const regularExpressions_1 = require("./regularExpressions");
const types_1 = require("./types");
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
    if ((0, types_1.isNonEmpty)(separatorsRest)) {
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
    return [...str.matchAll(regularExpressions_1.numberRgx)].map(([numberStr]) => +numberStr);
};
exports.getNumbers = getNumbers;
