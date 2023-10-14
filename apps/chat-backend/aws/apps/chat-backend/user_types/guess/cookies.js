"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGuessData = exports.getGuessCookies = void 0;
const constants_1 = require("chat-common/src/model/constants");
const security_1 = require("utils/src/security");
const cookieName = constants_1.userTypes.guess;
const getGuessCookies = (id) => [{
        name: cookieName,
        value: (0, security_1.encrypt)(process.env.ENCRIPTION_SECRET_KEY, id.toString()),
        path: constants_1.paths.guess,
        secure: true,
        samesite: "none",
        // roughly one year
        maxage: 60 * 60 * 24 * 30 * 12
    }];
exports.getGuessCookies = getGuessCookies;
const extractGuessData = (cookies) => __awaiter(void 0, void 0, void 0, function* () {
    const guess = { id: undefined, name: undefined };
    let found = false;
    let index = 0;
    while (index < cookies.length && !found) {
        const { name, value } = cookies[index];
        if (name === cookieName) {
            found = true;
            const decryptedId = (0, security_1.decrypt)(process.env.ENCRIPTION_SECRET_KEY, value);
            if (decryptedId.succeed) {
                guess.id = parseInt(decryptedId.output);
            }
        }
        index++;
    }
    return Promise.resolve(guess);
});
exports.extractGuessData = extractGuessData;
