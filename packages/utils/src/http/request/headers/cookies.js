"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequestCookies = exports.getRequestCookieHeader = exports.getRequestCookie = void 0;
const strings_1 = require("../../../strings");
const getRequestCookie = ({ name, value }) => name + "=" + value;
exports.getRequestCookie = getRequestCookie;
const getRequestCookieHeader = (...cookies) => "Cookie:" + cookies.map((cookie) => (0, exports.getRequestCookie)(cookie)).join(";");
exports.getRequestCookieHeader = getRequestCookieHeader;
const parseRequestCookies = (...cookiesStr) => {
    console.log("COOKIES STR: " + cookiesStr.toString());
    const cookies = [];
    for (const cookieStr of cookiesStr) {
        const namesValues = (0, strings_1.recursiveSplit)(cookieStr, [";", "="]);
        for (const nameValue of namesValues) {
            if (nameValue.length === 2)
                cookies.push({ name: nameValue[0], value: nameValue[1] });
        }
    }
    console.log("COOKIES: " + JSON.stringify(cookies));
    return cookies;
};
exports.parseRequestCookies = parseRequestCookies;
