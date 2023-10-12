"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const random_1 = require("./random");
const bitwise_1 = require("./bitwise");
const formatByte = (byte) => byte.toString(2).padStart(8, "0");
const minAsciiNumber = 33; //00100001
const maxAsciiNumber = 127; //01111111
const maxTargetBitPosition = Math.floor(Math.log2(minAsciiNumber));
const getTargetByteIndex = (secretByte) => secretByte >> 5;
const getTargetBitPosition = (secretByte) => (0, bitwise_1.sumRightBits)({ value: secretByte, length: maxTargetBitPosition - 1 }) + 1;
const getTargetAsciiNumber = (bitPosition, targetBit) => {
    const leftMin = minAsciiNumber >> bitPosition;
    const leftMax = maxAsciiNumber >> bitPosition;
    const left = (0, random_1.getRandomInt)(leftMin, leftMax);
    const leftAndTarget = (0, bitwise_1.joinBits)({ value: left, length: 8 - bitPosition }, { value: targetBit, length: 1 });
    const rightMin = leftAndTarget > (minAsciiNumber >> bitPosition) ? 0 : minAsciiNumber & (0xFF >> (9 - bitPosition));
    const rightMax = leftAndTarget < (maxAsciiNumber >> bitPosition) ? 0xFF >> (9 - bitPosition) : maxAsciiNumber & (0xFF >> (9 - bitPosition));
    const right = (0, random_1.getRandomInt)(rightMin, rightMax);
    return (0, bitwise_1.joinBits)({ value: leftAndTarget, length: 9 - bitPosition }, { value: right, length: bitPosition - 1 });
};
const getRandomAsciiNumber = () => (0, random_1.getRandomInt)(minAsciiNumber, maxAsciiNumber);
const encrypt = (secret, target) => {
    const targetBytes = Buffer.from(target);
    const secretBytes = Buffer.from(secret);
    const outputBytes = [];
    let secretBytesIndex = 0;
    let targetBytesIndex = 0;
    while (targetBytesIndex < targetBytes.length) {
        for (let i = 0; i < 8; i++) {
            const secretByte = secretBytes[secretBytesIndex];
            const targetByteIndex = getTargetByteIndex(secretByte);
            for (let j = 0; j < targetByteIndex; j++) {
                outputBytes.push(getRandomAsciiNumber());
            }
            const outputByte = getTargetAsciiNumber(getTargetBitPosition(secretByte), ((targetBytes[targetBytesIndex] >> (7 - i)) & 1));
            outputBytes.push(outputByte);
            secretBytesIndex = secretBytesIndex + (secretBytesIndex < secretBytes.length ? 1 : -secretBytes.length);
        }
        targetBytesIndex++;
    }
    return Buffer.from(outputBytes).toString("base64");
};
exports.encrypt = encrypt;
const decrypt = (secret, target) => {
    const targetBytes = Buffer.from(target, "base64");
    const secretBytes = Buffer.from(secret);
    const outputBytes = [];
    let error = false;
    let bitCount = 0;
    let outputByte = 0;
    let secretBytesIndex = 0;
    let targetBytesIndex = -1;
    while (!error && targetBytesIndex < targetBytes.length - 1) {
        const secretByte = secretBytes[secretBytesIndex];
        targetBytesIndex += getTargetByteIndex(secretByte) + 1;
        const targetByte = targetBytes[targetBytesIndex];
        if (targetByte !== undefined) {
            outputByte = outputByte | (((targetByte << (8 - getTargetBitPosition(secretByte))) >> bitCount) & (0b10000000 >> bitCount));
            if (bitCount < 7) {
                bitCount++;
            }
            else {
                outputBytes.push(outputByte);
                bitCount = 0;
                outputByte = 0;
            }
            secretBytesIndex = secretBytesIndex < secretBytes.length ? secretBytesIndex + 1 : 0;
        }
        else {
            error = true;
        }
    }
    if (bitCount > 0) {
        error = true;
    }
    return { succeed: !error, output: error ? "" : Buffer.from(outputBytes).toString("utf8") };
};
exports.decrypt = decrypt;
