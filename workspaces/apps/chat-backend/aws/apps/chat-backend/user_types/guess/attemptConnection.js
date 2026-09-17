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
exports.getResponseCookies = exports.attemptConnection = void 0;
const constants_1 = require("chat-common/src/model/constants");
const security_1 = require("utils/src/security");
const cookieName = constants_1.userTypes.guess;
const attemptConnection = (cookies, addConnectedGuess) => __awaiter(void 0, void 0, void 0, function* () {
    let idInCookie = undefined;
    let found = false;
    let index = 0;
    while (index < cookies.length && !found) {
        const { name, value } = cookies[index];
        if (name === cookieName) {
            found = true;
            const decryptedId = (0, security_1.decrypt)(process.env.ENCRIPTION_SECRET_KEY, value);
            if (decryptedId.succeed) {
                idInCookie = parseInt(decryptedId.output);
            }
        }
        index++;
    }
    return addConnectedGuess(idInCookie).then(({ id, date }) => ({ id, name: "guess" + id, date }));
});
exports.attemptConnection = attemptConnection;
const getResponseCookies = (id) => [{
        name: cookieName,
        value: (0, security_1.encrypt)(process.env.ENCRIPTION_SECRET_KEY, id.toString()),
        path: constants_1.paths.guess,
        secure: true,
        sameSite: "None",
        // roughly one year
        maxAge: 60 * 60 * 24 * 30 * 12
    }];
exports.getResponseCookies = getResponseCookies;
