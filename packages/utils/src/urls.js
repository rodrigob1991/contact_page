"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = void 0;
const getParam = (url, key) => {
    const startIndex = url.indexOf("=", url.search(key)) + 1;
    const endIndex = url.indexOf("&", startIndex);
    return url.substring(startIndex, endIndex < 0 ? url.length : endIndex);
};
exports.getParam = getParam;
