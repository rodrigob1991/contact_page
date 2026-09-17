"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponseCookies = exports.getResponseCookieHeaders = exports.getResponseCookie = exports.attributesNames = void 0;
const strings_1 = require("../../../strings");
const loops_1 = require("../../../loops");
const sameSiteValues = { lax: "Lax", none: "None", strict: "Strict" };
exports.attributesNames = {
    domain: "Domain",
    path: "Path",
    secure: "Secure",
    sameSite: "SameSite",
    httpOnly: "HttpOnly",
    expires: "Expires",
    maxAge: "Max-Age",
    partitioned: "Partitioned"
};
const getResponseCookie = ({ name, value, domain, path, secure, sameSite, httpOnly, expires, maxAge, partitioned }) => {
    let cookieStr = name + "=" + value + ";";
    if (domain !== undefined)
        cookieStr += exports.attributesNames.domain + "=" + domain + ";";
    if (path !== undefined)
        cookieStr += exports.attributesNames.path + "=" + path + ";";
    if (secure !== undefined)
        cookieStr += exports.attributesNames.secure + ";";
    if (sameSite !== undefined)
        cookieStr += exports.attributesNames.sameSite + "=" + sameSite + ";";
    if (httpOnly !== undefined)
        cookieStr += exports.attributesNames.httpOnly + ";";
    if (expires !== undefined)
        cookieStr += exports.attributesNames.expires + "=" + expires.toUTCString() + ";";
    if (maxAge !== undefined)
        cookieStr += exports.attributesNames.maxAge + "=" + maxAge + ";";
    if (partitioned !== undefined)
        cookieStr += exports.attributesNames.partitioned;
    return cookieStr.substring(0, cookieStr.length - 1);
};
exports.getResponseCookie = getResponseCookie;
const getResponseCookieHeaders = (...cookies) => cookies.map((cookie) => "Set-Cookie:" + (0, exports.getResponseCookie)(cookie));
exports.getResponseCookieHeaders = getResponseCookieHeaders;
const parseResponseCookies = (...cookiesStr) => {
    const cookies = [];
    for (const cookieStr of cookiesStr) {
        const attributes = (0, strings_1.recursiveSplit)(cookieStr, [";", "="]);
        const attributesNumber = attributes.length;
        if (attributesNumber > 0) {
            const nameValue = attributes[0];
            if (nameValue.length === 2) {
                const cookie = { name: nameValue[0].trim(), value: nameValue[1].trim() };
                (0, loops_1.doXTimes)(attributesNumber - 1, (n) => {
                    const attribute = attributes[n];
                    const attributePartsNumber = attribute.length;
                    if (attributePartsNumber > 0 && attributePartsNumber < 3) {
                        const name = attribute[0].trim();
                        if (attributePartsNumber === 1) {
                            switch (name) {
                                case exports.attributesNames.secure:
                                    cookie["secure"] = true;
                                    break;
                                case exports.attributesNames.httpOnly:
                                    cookie["httpOnly"] = true;
                                    break;
                                case exports.attributesNames.partitioned:
                                    cookie["partitioned"] = true;
                                    break;
                            }
                        }
                        else {
                            const value = attribute[1].trim();
                            switch (name) {
                                case exports.attributesNames.domain:
                                    cookie["domain"] = value;
                                    break;
                                case exports.attributesNames.path:
                                    cookie["path"] = value;
                                    break;
                                case exports.attributesNames.sameSite:
                                    if (value === sameSiteValues.lax || value === sameSiteValues.none || value === sameSiteValues.strict)
                                        cookie["sameSite"] = value;
                                    break;
                                case exports.attributesNames.expires:
                                    cookie["expires"] = new Date(value);
                                    break;
                                case exports.attributesNames.maxAge:
                                    const maxAge = +value;
                                    if (!isNaN(maxAge))
                                        cookie["maxAge"] = maxAge;
                                    break;
                            }
                        }
                    }
                });
                cookies.push(cookie);
            }
        }
    }
    return cookies;
};
exports.parseResponseCookies = parseResponseCookies;
