import {expect, test} from "@jest/globals"
import {decrypt, encrypt} from "../security"

const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
const getStrings = (min: number, max: number) => {
    const length = getRandomNumber(min, max)
    const bytes: number[] = []
    for (let i = 0; i < length; i++) {
        bytes.push(getRandomNumber(33, 126))
    }
    return Buffer.from(bytes).toString("utf-8")
}

for (let i = 0; i < 10000 ; i++) {
    const secret = getStrings(5, 50)
    const target = getStrings(1, 30)
    const encrypted = encrypt(secret, target)
    test("failed to decode " + encrypted, () => {
        expect(decrypt(secret, encrypted)).toEqual(target)
    })
}
