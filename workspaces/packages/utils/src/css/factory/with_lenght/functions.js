"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCSSPropertyWithFunctionsWithLengthStr = exports.getCSSFunctionWithLengthStr = exports.getCSSPropertyWithLengthKeyValue = exports.getCSSPropertyWithLengthStr = exports.getCSSLengthValueStr = void 0;
const base_1 = require("../base");
function map(values) {
    return values.map(({ value, unit }) => value + unit);
}
function getCSSLengthValueStr(values) {
    return (0, base_1.getCSSValueStr)(map(values));
}
exports.getCSSLengthValueStr = getCSSLengthValueStr;
function getCSSPropertyWithLengthStr(name, values) {
    return (0, base_1.getCSSPropertyStr)(name, map(values));
}
exports.getCSSPropertyWithLengthStr = getCSSPropertyWithLengthStr;
function getCSSPropertyWithLengthKeyValue(name, values) {
    return { [name]: getCSSLengthValueStr(values) };
}
exports.getCSSPropertyWithLengthKeyValue = getCSSPropertyWithLengthKeyValue;
function getCSSFunctionWithLengthStr(name, values) {
    return (0, base_1.getCSSFunctionStr)(name, map(values));
}
exports.getCSSFunctionWithLengthStr = getCSSFunctionWithLengthStr;
function getCSSPropertyWithFunctionsWithLengthStr(name, fnNamesValues) {
    return (0, base_1.getCSSPropertyWithFunctionsStr)(name, fnNamesValues.map(([fnName, fnValues]) => [fnName, map(fnValues)]));
}
exports.getCSSPropertyWithFunctionsWithLengthStr = getCSSPropertyWithFunctionsWithLengthStr;
