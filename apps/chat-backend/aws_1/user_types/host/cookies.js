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
exports.extractHostData = exports.getHostCookies = void 0;
const constants_1 = require("chat-common/src/model/constants");
const app_1 = require("../../app");
const authentication_1 = require("./authentication");
const cookieNamePrefix = constants_1.userTypes.host;
const getHostCookies = () => {
    return [];
};
exports.getHostCookies = getHostCookies;
const extractHostData = (cookies) => __awaiter(void 0, void 0, void 0, function* () {
    let index = 0;
    let host;
    while (index < cookies.length && !host) {
        const { name, value } = cookies[index];
        if (name.startsWith(cookieNamePrefix)) {
            const id = +name.substring(cookieNamePrefix.length);
            if (!isNaN(id)) {
                host = yield (0, authentication_1.getHostIfValidRegistered)(id, value).catch((r) => (0, app_1.panic)(r, "host", id));
            }
        }
        index++;
    }
    if (!host)
        (0, app_1.panic)("could not found valid authentication cookies", "host");
    return host;
});
exports.extractHostData = extractHostData;
