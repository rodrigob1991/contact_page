"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const random_1 = require("../random");
const separator1 = ",";
const separator2 = ":";
const separator3 = "$";
const separator4 = ")";
const separator5 = "(";
const separator6 = "&";
const separator7 = "!";
const separators = [separator1, separator2, separator3, separator4, separator5, separator6, separator7];
const part1 = "part1";
const part2 = "part2";
const part3 = "";
const part4 = " ";
const part5 = "part5";
const parts = [part1, part2, part3, part4, part5];
const getRandomPart = () => parts[(0, random_1.getRandomInt)(0, parts.length - 1)];
const getRecursiveSplitTestCase = () => {
    const separatorsIndexes = [0, 1, 2, 3, 4, 5, 6];
    const strings = [];
    const separators = [];
    const result = [];
    const separatorsCount = (0, random_1.getRandomInt)(1, separatorsIndexes.length);
    for (let i = 0; i < separatorsCount; i++) {
        const separator = separators[separatorsIndexes.splice((0, random_1.getRandomInt)(0, separatorsIndexes.length - 1), 1)[0]];
        separators.push(separator);
        const separatorCount = (0, random_1.getRandomInt)(1, 10);
        let lastIndex = 0;
        for (let j = 0; j < separatorCount; j++) {
            lastIndex += (0, random_1.getRandomInt)(1, 20);
            while (strings[lastIndex]) {
                lastIndex += 1;
            }
            strings[lastIndex] = separator;
        }
    }
    return [, separators, result];
};
(0, globals_1.test)("correctly ordered ascendant records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberAscendant.length; i++) {
        (0, globals_1.expect)(recordsWithNumberAscendant[i]).toEqual(recordsWithNumberAscendantResult[i]);
    }
});
