import {expect, test} from "@jest/globals"
import {decrypt, encrypt} from "../security"
import {getRandomInt} from "../random"

const getStrings = (min: number, max: number) => {
    const length = getRandomInt(min, max)
    const bytes: number[] = []
    for (let i = 0; i < length; i++) {
        bytes.push(getRandomInt(33, 126))
    }
    return Buffer.from(bytes).toString("utf-8")
}


for (let i = 0; i < 100; i++) {
    const secret = getStrings(5, 50)
    const target = getStrings(1, 30)
    const encrypted = encrypt(secret, target)
    test("decode " + encrypted, () => {
        expect(decrypt(secret, encrypted).output).toEqual(target)
    })
}


/*const secret = "dgfhk98yhh?"
const target = (1).toString()
const encrypted = encrypt(secret, target)
test("failed to decode " + encrypted, () => {
    expect(decrypt(secret, encrypted).output).toEqual(target)
})*/
