"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const random_1 = require("../random");
const loops_1 = require("../loops");
const strings_1 = require("../strings");
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
    const resultSeparators = [];
    const resultParts = [];
    const separatorsNumber = (0, random_1.getRandomInt)(1, separatorsIndexes.length);
    (0, loops_1.doXTimes)(separatorsNumber, (i) => {
        const separator = separators[separatorsIndexes.splice((0, random_1.getRandomInt)(0, separatorsIndexes.length - 1), 1)[0]];
        resultSeparators.push(separator);
        const getNewPart = () => {
            let part;
            if (i === separatorsNumber) {
                part = getRandomPart();
            }
            else {
                const getEmptyPart = (x) => {
                    let r;
                    if (i === x) {
                        r = "";
                    }
                    else {
                        // @ts-ignore
                        r = [getEmptyPart(x - 1)];
                    }
                    return r;
                };
                part = getEmptyPart(separatorsNumber);
            }
            return part;
        };
        const addNewParts = () => {
            let currentPart = resultParts;
            (0, loops_1.doXTimes)(i - 1, () => {
                currentPart = currentPart[(0, random_1.getRandomInt)(0, currentPart.length - 1)];
            });
            const newParts = [getNewPart()];
            if (currentPart.length < 2) {
                newParts.push(getNewPart());
                if (currentPart.length === 1) {
                    currentPart.pop();
                }
            }
            currentPart.push(...newParts);
        };
        const separatorNumber = (0, random_1.getRandomInt)(1, 8);
        (0, loops_1.doXTimes)(separatorNumber, () => {
            addNewParts();
        });
    });
    const getText = (sep, re) => {
        let text = "";
        const currentSep = sep[0];
        for (const r of re) {
            const currentText = Array.isArray(r) ? getText(sep.slice(1, sep.length), r) : r;
            text += currentText + currentSep;
        }
        return text.substring(0, text.length - 1);
    };
    return [resultSeparators, getText(resultSeparators, resultParts), resultParts];
};
(0, loops_1.doXTimes)(1000, ((i) => {
    (0, globals_1.test)("recursive split " + i, () => {
        const [separators, text, expectedResult] = getRecursiveSplitTestCase();
        const result = (0, strings_1.recursiveSplit)(text, separators);
        (0, globals_1.expect)(expectedResult).toEqual(result);
    });
}));
