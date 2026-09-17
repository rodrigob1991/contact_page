"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.log = exports.getStandardMessage = void 0;
const getStandardMessage = (msg, userType, userId) => (userType ? (userType + (userId === undefined ? "" : " " + userId)) + ": " : "") + msg + " : " + new Date().toString();
exports.getStandardMessage = getStandardMessage;
const log = (msg, userType, userId) => {
    console.log((0, exports.getStandardMessage)(msg, userType, userId));
};
exports.log = log;
const logError = (msg, userType, userId) => {
    console.error((0, exports.getStandardMessage)(msg, userType, userId));
};
exports.logError = logError;
