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
const authentication_1 = require("./authentication");
const constants_1 = require("chat-common/src/model/constants");
const authentication_2 = require("../../errors/authentication");
const cookieNamePrefix = constants_1.userTypes.host;
const attemptConnection = (cookies, addConnectedHost) => __awaiter(void 0, void 0, void 0, function* () {
    let id;
    let host;
    let index = 0;
    while (index < cookies.length && !host) {
        console.log("Cookie:" + JSON.stringify(cookies[index]));
        const { name, value } = cookies[index];
        if (name.startsWith(cookieNamePrefix)) {
            id = +name.substring(cookieNamePrefix.length);
            if (!isNaN(id)) {
                host = yield (0, authentication_1.getHostIfValidRegistered)(id, value);
            }
        }
        index++;
    }
    if (!host)
        throw new authentication_2.HostAuthenticationError("valid data was not found in cookies", id);
    return addConnectedHost(host.id).then(({ date }) => (Object.assign(Object.assign({}, host), { date })));
});
exports.attemptConnection = attemptConnection;
const getResponseCookies = () => {
    return [];
};
exports.getResponseCookies = getResponseCookies;
