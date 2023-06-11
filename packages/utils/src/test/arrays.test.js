"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const arrays_1 = require("utils/src/arrays");
const recordsWithNumber = [{ key: 2 }, { key: 8 }, { key: 2 }, { key: 4 }, { key: 3 }];
const recordsWithNumberAscendant = [{ key: 2 }, { key: 2 }, { key: 3 }, { key: 4 }, { key: 8 }];
const recordsWithNumberAscendantResult = (0, arrays_1.orderByCounting)(recordsWithNumber, "key", (key) => key);
(0, globals_1.test)("correctly ordered ascendant records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberAscendant.length; i++) {
        (0, globals_1.expect)(recordsWithNumberAscendant[i]).toEqual(recordsWithNumberAscendantResult[i]);
    }
});
const recordsWithNumberDescendant = [{ key: 8 }, { key: 4 }, { key: 3 }, { key: 2 }, { key: 2 }];
const recordsWithNumberDescendantResult = (0, arrays_1.orderByCounting)(recordsWithNumber, "key", (key) => key, "descendant");
(0, globals_1.test)("correctly ordered descendant records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberDescendant.length; i++) {
        (0, globals_1.expect)(recordsWithNumberDescendant[i]).toEqual(recordsWithNumberDescendantResult[i]);
    }
});
const recordsWithString = [{ key: "ar" }, { key: "zo" }, { key: "ty" }, { key: "er" }, { key: "ae" }];
const recordsWithStringsAscendant = [{ key: "ae" }, { key: "ar" }, { key: "er" }, { key: "ty" }, { key: "zo" }];
const recordsWithStringAscendantResult = (0, arrays_1.orderByComparePreviousByString)([...recordsWithString], "key");
(0, globals_1.test)("correctly ascendant records with string  by compare previous", () => {
    for (let i = 0; i < recordsWithStringsAscendant.length; i++) {
        (0, globals_1.expect)(recordsWithStringsAscendant[i]).toEqual(recordsWithStringAscendantResult[i]);
    }
});
const recordsWithStringsDescendant = [{ key: "zo" }, { key: "ty" }, { key: "er" }, { key: "ar" }, { key: "ae" }];
const recordsWithStringDescendantResult = (0, arrays_1.orderByComparePreviousByString)([...recordsWithString], "key", "descendant");
(0, globals_1.test)("correctly descendant records with string  by compare previous", () => {
    for (let i = 0; i < recordsWithStringsDescendant.length; i++) {
        (0, globals_1.expect)(recordsWithStringsDescendant[i]).toEqual(recordsWithStringDescendantResult[i]);
    }
});
