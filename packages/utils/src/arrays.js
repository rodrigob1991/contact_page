"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderByComparePreviousByString = exports.orderByComparePreviousByNumber = exports.orderByCounting = void 0;
const orderByCounting = (array, key, getIndex, direction = "ascendant") => {
    const countingArray = [];
    for (const e of array) {
        const countIndex = getIndex(e[key]);
        const ca = countingArray[countIndex];
        if (ca) {
            ca.push(e);
        }
        else {
            countingArray[countIndex] = [e];
        }
    }
    const resultArray = [];
    const forArgs = direction === "ascendant"
        ? { index: 0, until: function () { return this.index < countingArray.length; }, afterEach: function () { this.index++; } }
        : { index: countingArray.length - 1, until: function () { return this.index > 0; }, afterEach: function () { this.index--; } };
    for (forArgs.index; forArgs.until(); forArgs.afterEach()) {
        const ca = countingArray[forArgs.index];
        if (ca) {
            resultArray.push(...ca);
        }
    }
    return resultArray;
};
exports.orderByCounting = orderByCounting;
// preferable use for smalls numbers of elements
const orderByComparePreviousByNumber = (records, key, direction = "ascendant") => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i;
        const areDifferent = direction === "ascendant"
            ? (prev, curr) => prev > curr
            : (prev, curr) => prev < curr;
        while (currentIndex - 1 >= 0 && areDifferent(records[currentIndex - 1][key], records[currentIndex][key])) {
            const current = records[currentIndex];
            records[currentIndex] = records[currentIndex - 1];
            records[currentIndex - 1] = current;
            currentIndex--;
        }
    }
    return records;
};
exports.orderByComparePreviousByNumber = orderByComparePreviousByNumber;
const orderByComparePreviousByString = (records, key, direction = "ascendant") => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i;
        const areDifferent = direction === "ascendant"
            ? (prev, curr) => prev.toLowerCase().localeCompare(curr.toLowerCase()) === 1
            : (prev, curr) => prev.toLowerCase().localeCompare(curr.toLowerCase()) === -1;
        while (currentIndex - 1 >= 0 && areDifferent(records[currentIndex - 1][key], records[currentIndex][key])) {
            const current = records[currentIndex];
            records[currentIndex] = records[currentIndex - 1];
            records[currentIndex - 1] = current;
            currentIndex--;
        }
    }
    return records;
};
exports.orderByComparePreviousByString = orderByComparePreviousByString;
