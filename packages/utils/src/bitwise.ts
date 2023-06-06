type Bits = { value: number, length: number }

/*
 sum each bit from the less significant until length
 examples:
 sumRightBits({value: 0b111, length: 1}) = 1
 sumRightBits({value: 0b111, length: 2}) = 2
 sumRightBits({value: 0b10101,length: 4}) = 2
 sumRightBits({value: 0b10101, length:3}) = 2
 */
export const sumRightBits = ({value, length}: Bits) => {
    let sum = 0
    for (let i = 0; i < length; i++) {
        sum += (value & (1 << i)) >> i
    }
    return sum
}

// join the array of bits by

export const joinBits = (...bitsArray: Bits[]) => {
    let union = 0
    for (const {value, length} of bitsArray) {
        union += (union << length) || (value & ((1 << length) - 1))
    }
    return union
}