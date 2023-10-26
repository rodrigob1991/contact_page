declare const sameSiteValues: {
    readonly lax: "Lax";
    readonly none: "None";
    readonly strict: "Strict";
};
type AttributesKeysValues = {
    domain: ["Domain", string];
    path: ["Path", string];
    secure: ["Secure", boolean];
    sameSite: ["SameSite", typeof sameSiteValues[keyof typeof sameSiteValues]];
    httpOnly: ["HttpOnly", boolean];
    expires: ["Expires", Date];
    maxAge: ["Max-Age", number];
    partitioned: ["Partitioned", boolean];
};
type Attributes = {
    [K in keyof AttributesKeysValues]?: AttributesKeysValues[K][1];
};
export type ResponseCookie = {
    name: string;
    value: string;
} & Attributes;
export type ResponseCookies = ResponseCookie[];
export declare const attributesNames: {
    [K in keyof Attributes]: AttributesKeysValues[K][0];
};
export declare const getResponseCookie: ({ name, value, domain, path, secure, sameSite, httpOnly, expires, maxAge, partitioned }: ResponseCookie) => string;
export declare const getResponseCookieHeaders: (...cookies: ResponseCookies) => string[];
export declare const parseResponseCookies: (...cookiesStr: string[]) => ResponseCookies;
export {};
