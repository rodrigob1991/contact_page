import {getRandomInt} from "./random"
import {joinBits, sumRightBits} from "./bitwise"

const formatByte = (byte: number) => byte.toString(2).padStart(8, "0")

const minAsciiNumber = 33 //00100001
const maxAsciiNumber = 127 //01111111
const maxTargetBitPosition = Math.floor(Math.log2(minAsciiNumber))

const getTargetByteIndex = (secretByte: number) => secretByte >> 5

const getTargetBitPosition = (secretByte: number) => sumRightBits({value: secretByte, length: maxTargetBitPosition -1}) + 1

const getTargetAsciiNumber = (bitPosition: number, targetBit: 0 | 1) => {
    const leftMin = minAsciiNumber >> bitPosition
    const leftMax = maxAsciiNumber >> bitPosition
    const left = getRandomInt(leftMin, leftMax)
    const leftAndTarget = joinBits({value: left, length: 8 - bitPosition}, {value: targetBit, length: 1})
    const rightMin = leftAndTarget > (minAsciiNumber >> bitPosition) ? 0 : minAsciiNumber & (0xFF >> (9 - bitPosition))
    const rightMax = leftAndTarget < (maxAsciiNumber >> bitPosition) ? 0xFF >> (9 - bitPosition) : maxAsciiNumber & (0xFF >> (9 - bitPosition))
    const right = getRandomInt(rightMin, rightMax)
    return joinBits({value: leftAndTarget, length: 9 - bitPosition}, {value: right, length: bitPosition - 1})
}

const getRandomAsciiNumber = () => getRandomInt(minAsciiNumber, maxAsciiNumber)

export const encrypt = (secret: string, target: string) => {
    const targetBytes = Buffer.from(target)
    const secretBytes = Buffer.from(secret)

    const outputBytes: number[] = []

    let secretBytesIndex = 0
    let targetBytesIndex = 0
    while (targetBytesIndex < targetBytes.length) {
        for (let i = 0; i < 8; i++) {
            const secretByte = secretBytes[secretBytesIndex]
            const targetByteIndex = getTargetByteIndex(secretByte)
            for (let j = 0; j < targetByteIndex; j++) {
                outputBytes.push(getRandomAsciiNumber())
            }
            const outputByte = getTargetAsciiNumber(getTargetBitPosition(secretByte), ((targetBytes[targetBytesIndex] >> (7 - i)) & 1) as 0 | 1)
            outputBytes.push(outputByte)
            secretBytesIndex = secretBytesIndex + (secretBytesIndex < secretBytes.length ? 1 : - secretBytes.length)
        }
        targetBytesIndex++
    }

    return Buffer.from(outputBytes).toString("base64url")
}

export const decrypt = (secret: string, target: string) => {
    const targetBytes = Buffer.from(target,"base64url")
    const secretBytes = Buffer.from(secret)
    const outputBytes: number[] = []

    let error = false
    let bitCount = 0
    let outputByte = 0
    let secretBytesIndex = 0
    let targetBytesIndex = -1
    while (!error && targetBytesIndex < targetBytes.length -1) {
        const secretByte = secretBytes[secretBytesIndex]
        targetBytesIndex += getTargetByteIndex(secretByte) + 1
        const targetByte = targetBytes[targetBytesIndex]

        if (targetByte) {
            outputByte = outputByte | (((targetByte << (8 - getTargetBitPosition(secretByte))) >> bitCount) & (0b10000000 >> bitCount))
            if (bitCount < 7) {
                bitCount++
            } else {
                outputBytes.push(outputByte)
                bitCount = 0
                outputByte = 0
            }
            secretBytesIndex = secretBytesIndex < secretBytes.length ? secretBytesIndex + 1 : 0
        } else {
            error = true
        }
    }
    if (bitCount > 0) {
        error = true
    }

    return {succeed: !error, output: error ? "" : Buffer.from(outputBytes).toString("utf8")}
}
