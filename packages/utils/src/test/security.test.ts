import {expect, test} from "@jest/globals"
import {decrypt, encrypt} from "../security"

const secretKey = "`+¨^^Ñ*.fsd8,"

const firstTextToEncode = "Ñ0p098qw4"
const firstTextEncoded = encrypt(secretKey, firstTextToEncode)
console.log("ENCRYPTED: " + firstTextEncoded)

test("correctly decode " + firstTextEncoded, () => {
    expect(decrypt(secretKey, firstTextEncoded)).toEqual(firstTextToEncode)
})
