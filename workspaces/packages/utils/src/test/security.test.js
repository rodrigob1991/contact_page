"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const security_1 = require("../security");
const random_1 = require("../random");
const getStrings = (min, max) => {
    const length = (0, random_1.getRandomInt)(min, max);
    const bytes = [];
    for (let i = 0; i < length; i++) {
        bytes.push((0, random_1.getRandomInt)(33, 126));
    }
    return Buffer.from(bytes).toString("utf-8");
};
for (let i = 0; i < 100; i++) {
    const secret = getStrings(5, 50);
    const target = getStrings(1, 30);
    const encrypted = (0, security_1.encrypt)(secret, target);
    (0, globals_1.test)("decode " + encrypted, () => {
        (0, globals_1.expect)((0, security_1.decrypt)(secret, encrypted).output).toEqual(target);
    });
}
/*const secret = "dgfhk98yhh?"
const target = (1).toString()
const encrypted = encrypt(secret, target)
test("failed to decode " + encrypted, () => {
    expect(decrypt(secret, encrypted).output).toEqual(target)
})*/
