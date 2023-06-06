import {getRandomInt} from "./random"
import {joinBits, sumRightBits} from "./bitwise"

const completeWithZeros = (bites: string) => {
    bites.padStart(8, "0")
}

const minAsciiNumber = 33 //00100001
const maxAsciiNumber = 127 //01111111
const maxTargetBitPosition = Math.floor(Math.log2(minAsciiNumber))

const getTargetByteIndex = (secretByte: number) => secretByte >> 5

const getTargetBitPosition = (secretByte: number) => sumRightBits({value: secretByte, length: maxTargetBitPosition})

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
    const encoder = new TextEncoder()
    const targetBytes = encoder.encode(target)
    const secretBytes = encoder.encode(secret)

    const outputBytes: number[] = []

    /*const outputSBytesStr: string[] = []
    const outputTBytesStr: string[] = []*/

    let secretBytesIndex = 0
    let targetBytesIndex = 0
    while (targetBytesIndex < targetBytes.length) {
        for (let i = 0; i < 8; i++) {
            const secretByte = secretBytes[secretBytesIndex]
            const targetByteIndex = getTargetByteIndex(secretByte)
            for (let j = 0; j < targetByteIndex; i++) {
                outputBytes.push(getRandomAsciiNumber())
            }
            outputBytes.push(getTargetAsciiNumber(getTargetBitPosition(secretByte), ((targetBytes[targetBytesIndex] >> (7 - i)) & 1) as 0 | 1))
            /*outputSBytesStr.push(completeWithZeros((((~secretBytes[secretBytesIndex] & 0xFF) | (0b10000000 >> i))).toString(2)))
            outputTBytesStr.push(completeWithZeros(((targetBytes[targetBytesIndex] & 0xFF >> i) | (~(0b10000000 >> i) & 0xFF)).toString(2)))*/
            // outputBytes.push(getAsciiNumber(((~secretBytes[secretBytesIndex] & 0xFF) | (0b10000000 >> i)) & ((targetBytes[targetBytesIndex] & 0xFF >> i) | (~(0b10000000 >> i) & 0xFF))))
            secretBytesIndex = secretBytesIndex + (secretBytesIndex < secretBytes.length ? 1 : - secretBytes.length)
        }
        targetBytesIndex++
    }

   /* const targetBytesStr: string[] = []
    targetBytes.forEach(b => targetBytesStr.push(completeWithZeros(b.toString(2))))
    const secretBytesStr: string[] = []
    secretBytes.forEach(b => secretBytesStr.push(completeWithZeros(b.toString(2))))
    const outputBytesStr: string[] = []
    outputBytes.forEach(b => outputBytesStr.push(completeWithZeros(b.toString(2))))
    console.log("target:  " + targetBytesStr + "\nsecret:  " + secretBytesStr + "\noutputS: " + outputSBytesStr + "\noutputT: " + outputTBytesStr + "\noutput:  " + outputBytesStr )
*/
    return Buffer.from(outputBytes).toString("utf8")
}

export const decrypt = (secret: string, target: string) => {
    const encoder = new TextEncoder()
    const targetBytes = encoder.encode(target)
    const secretBytes = encoder.encode(secret)
    const outputBytes: number[] = []

    let error = false
    let bitCount = 0
    let outputByte = 0
    let secretBytesIndex = 0
    let targetBytesIndex = 0
    while (!error && targetBytesIndex < targetBytes.length) {
        //const encryptedByte = targetBytes[targetBytesIndex]
        /*const shiftSecretByte = ~secretBytes[secretBytesIndex] & 0xFF
        const shiftSecretByteOppositeIBite = shiftSecretByte ^ (10000000 >> bitCount)*/
        //const targetByte = encryptedByte === getAsciiNumber(shiftSecretByte) ? shiftSecretByte : encryptedByte === getAsciiNumber(shiftSecretByteOppositeIBite) ? shiftSecretByteOppositeIBite : undefined
        const secretByte = secretBytes[secretBytesIndex]
        const targetByte = targetBytes[getTargetByteIndex(secretByte)]

        if (targetByte !== undefined) {
            outputByte = outputByte | ((targetByte << 8 - getTargetBitPosition(secretByte)) & (0b10000000 >> bitCount))
            if (bitCount < 7) {
                bitCount++
            } else {
                outputBytes.push(outputByte)
                bitCount = 0
                outputByte = 0
            }
            targetBytesIndex ++
            secretBytesIndex = secretBytesIndex < secretBytes.length ? secretBytesIndex + 1 : 0
        } else {
            error = true
        }
    }
    if (bitCount > 0) {
        error = true
    }
    /*const outputBytesStr: string[] = []
    const targetBytesStr: string[] = []
    outputBytes.forEach(b => outputBytesStr.push(completeWithZeros(b.toString(2))))
    targetBytes.forEach(b => targetBytesStr.push(completeWithZeros(b.toString(2))))
    console.log("target decode:  " + targetBytesStr + "\noutput decode: " + outputBytesStr)*/

    return {succeed: !error, output: error ? "" : Buffer.from(outputBytes).toString("utf8")}
}
