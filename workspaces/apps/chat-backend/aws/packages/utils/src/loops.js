"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doXTimes = void 0;
const doXTimes = (x, fn) => {
    for (let i = 1; i <= x; i++) {
        fn(i);
    }
};
exports.doXTimes = doXTimes;
