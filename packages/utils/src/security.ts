const completeWithZeros = (bites: string) => {
    let zeros = ""
    while (zeros.length + bites.length < 8) {
        zeros += "0"
    }
    return zeros + bites
}
const getAsciiNumber = (n: number) => {
    let asciiNumber: number
    switch (true) {
        case n < 33:
            asciiNumber = 50 + n
            break
        case n > 127:
            asciiNumber = getAsciiNumber(n - 127)
            break
        default:
            asciiNumber = n
    }
    return asciiNumber
}
export const encrypt = (secret: string, target: string) => {
    const encoder = new TextEncoder()
    const targetBytes = encoder.encode(target)
    const secretBytes = encoder.encode(secret)

    const outputBytes: number[] = []

    const outputSBytesStr: string[] = []
    const outputTBytesStr: string[] = []

    let secretBytesIndex = 0
    let targetBytesIndex = 0
    while (targetBytesIndex < targetBytes.length) {
        for (let i = 0; i < 8; i++) {
            outputSBytesStr.push(completeWithZeros((((~secretBytes[secretBytesIndex] & 0xFF) | (0b10000000 >> i))).toString(2)))
            outputTBytesStr.push(completeWithZeros(((targetBytes[targetBytesIndex] & 0xFF >> i) | (~(0b10000000 >> i) & 0xFF)).toString(2)))
            outputBytes.push(getAsciiNumber(((~secretBytes[secretBytesIndex] & 0xFF) | (0b10000000 >> i)) & ((targetBytes[targetBytesIndex] & 0xFF >> i) | (~(0b10000000 >> i) & 0xFF))))
            secretBytesIndex = secretBytesIndex + (secretBytesIndex < secretBytes.length ? 1 : - secretBytes.length)
        }
        targetBytesIndex++
    }

    const targetBytesStr: string[] = []
    targetBytes.forEach(b => targetBytesStr.push(completeWithZeros(b.toString(2))))
    const secretBytesStr: string[] = []
    secretBytes.forEach(b => secretBytesStr.push(completeWithZeros(b.toString(2))))
    const outputBytesStr: string[] = []
    outputBytes.forEach(b => outputBytesStr.push(completeWithZeros(b.toString(2))))
    console.log("target:  " + targetBytesStr + "\nsecret:  " + secretBytesStr + "\noutputS: " + outputSBytesStr + "\noutputT: " + outputTBytesStr + "\noutput:  " + outputBytesStr )

    return Buffer.from(outputBytes).toString("utf8")
}

export const decrypt = (secret: string, target: string) => {
    const encoder = new TextEncoder()
    const targetBytes = encoder.encode(target)
    const secretBytes = encoder.encode(secret)
    const outputBytes: number[] = []

    let bitCount = 0
    let outputByte = 0
    let secretBytesIndex = 0
    for (let i = 0; i < targetBytes.length; i++) {
        const encryptedByte = targetBytes[i]
        const shiftSecretByte = ~secretBytes[secretBytesIndex] & 0xFF
        const targetByte = encryptedByte === getAsciiNumber(shiftSecretByte) ? shiftSecretByte : shiftSecretByte ^ (10000000 >> bitCount)

        outputByte = outputByte | (targetByte & (0b10000000 >> bitCount))
        if (bitCount < 7) {
            bitCount++
        } else {
            outputBytes.push(outputByte)
            bitCount = 0
            outputByte = 0
        }
        secretBytesIndex = secretBytesIndex < secretBytes.length ? secretBytesIndex + 1 : 0
    }
    const outputBytesStr: string[] = []
    const targetBytesStr: string[] = []
    outputBytes.forEach(b => outputBytesStr.push(completeWithZeros(b.toString(2))))
    targetBytes.forEach(b => targetBytesStr.push(completeWithZeros(b.toString(2))))
    console.log("target decode:  " + targetBytesStr + "\noutput decode: " + outputBytesStr)

    return Buffer.from(outputBytes).toString("utf8")
}
