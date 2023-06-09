"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinBits = exports.sumRightBits = void 0;
/*
 sum each bit from the less significant until length
 examples:
 sumRightBits({value: 0b111, length: 1}) = 1
 sumRightBits({value: 0b111, length: 2}) = 2
 sumRightBits({value: 0b10101,length: 4}) = 2
 sumRightBits({value: 0b10101, length:3}) = 2
 */
const sumRightBits = ({ value, length }) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
        sum += (value & (1 << i)) >> i;
    }
    return sum;
};
exports.sumRightBits = sumRightBits;
// join the array of bits by
const joinBits = (...bitsArray) => {
    let union = 0;
    for (const { value, length } of bitsArray) {
        union = (union << length) | (value & ((1 << length) - 1));
    }
    return union;
};
exports.joinBits = joinBits;
