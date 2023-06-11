import {expect, test} from "@jest/globals"
import {Bits, joinBits, sumRightBits} from "../bitwise"

const testSumRightBits = (value: number, length: number, expected: number) => {
    test("failed to sum the last " + length + " bits of " + value, () => {
        expect(sumRightBits({value, length})).toEqual(expected)
    })
}
testSumRightBits(0b0011, 2, 2)
testSumRightBits(0b0011, 1, 1)
testSumRightBits(0b0011, 0, 0)
testSumRightBits(0b0011, 8, 2)
testSumRightBits(0b100101, 8, 3)
testSumRightBits(0b100101, 10, 3)
testSumRightBits(0b100101, 1, 1)
testSumRightBits(0b100101, 5, 2)

const testJoinBits = (expected: number, ...bits: Bits[]) => {
    test("failed to join the bits " + JSON.stringify(bits), () => {
        expect(joinBits(...bits)).toEqual(expected)
    })
}
testJoinBits(0b11101111, {value: 0b11101, length: 8}, {value: 0b011, length: 1}, {value: 0b11, length: 2})
testJoinBits(0b1010011, {value: 0b101, length: 3}, {value: 0b11, length: 4})
testJoinBits(0b10010110000010100101, {value: 0b101, length: 2}, {value: 0b1011, length: 6}, {value: 0b101, length: 8},{value: 0b101, length: 5})
testJoinBits(0b1010000, {value: 0b101, length: 3}, {value: 0b0, length: 4})
testJoinBits(0b100001, {value: 0b101, length: 2}, {value: 0b0, length: 4}, {value: 0b11, length: 1})
testJoinBits(0b101, {value: 0b101, length: 3}, {value: 0b11, length: 0})
testJoinBits(0b11, {value: 0b101, length: 0}, {value: 0b11, length: 4})
testJoinBits(0b0, {value: 0b101, length: 0})
testJoinBits(0b1, {value: 0b101, length: 2})
testJoinBits(0b101, {value: 0b101, length: 10})



