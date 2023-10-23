import {recursiveSplit} from "../../../strings"
import {doXTimes} from "../../../loops"

const sameSiteValues = {lax: "Lax", none: "None", strict: "Strict"} as const
type AttributesKeysValues = {
    domain: ["Domain", string]
    path: ["Path", string]
    secure: ["Secure", boolean]
    sameSite: ["SameSite", typeof sameSiteValues[keyof typeof sameSiteValues]]
    httpOnly: ["HttpOnly", boolean]
    expires: ["Expires", Date]
    maxAge: ["Max-Age", number]
    partitioned: ["Partitioned", boolean]
}
type Attributes = { [K in keyof AttributesKeysValues]?: AttributesKeysValues[K][1] }

export type ResponseCookie = {name: string, value: string}  & Attributes
export type ResponseCookies = ResponseCookie[]

export const attributesNames: { [K in keyof Attributes]: AttributesKeysValues[K][0] } = {
    domain: "Domain",
    path: "Path",
    secure: "Secure",
    sameSite: "SameSite",
    httpOnly: "HttpOnly",
    expires: "Expires",
    maxAge: "Max-Age",
    partitioned: "Partitioned"
}
export const getResponseCookie = ({name, value, domain, path, secure, sameSite, httpOnly, expires, maxAge, partitioned}: ResponseCookie) => {
    let cookieStr = name + "=" + value + ";"
    if (domain !== undefined)
        cookieStr += attributesNames.domain + "=" + domain + ";"
    if (path !== undefined)
        cookieStr += attributesNames.path + "=" + path + ";"
    if (secure !== undefined)
        cookieStr += attributesNames.secure + ";"
    if (sameSite !== undefined)
        cookieStr += attributesNames.sameSite + "=" + sameSite + ";"
    if (httpOnly !== undefined)
        cookieStr += attributesNames.httpOnly + ";"
    if (expires !== undefined)
        cookieStr += attributesNames.expires + "=" + expires.toUTCString() + ";"
    if (maxAge !== undefined)
        cookieStr += attributesNames.maxAge + "=" + maxAge + ";"
    if (partitioned !== undefined)
        cookieStr += attributesNames.partitioned

    return cookieStr.substring(0, cookieStr.length - 1)
}
export const getResponseCookieHeaders = (...cookies: ResponseCookies) => cookies.map((cookie) => "Set-Cookie:" + getResponseCookie(cookie))
export const parseResponseCookies = (...cookiesStr: string[]) => {
    const cookies: ResponseCookies = []
    for (const cookieStr of cookiesStr) {
        const attributes = recursiveSplit(cookieStr, [";", "="])
        const attributesNumber = attributes.length
        if (attributesNumber > 0) {
            const nameValue = attributes[0]
            if (nameValue.length === 2) {
                const cookie: ResponseCookie = {name: nameValue[0], value: nameValue[1]}
                doXTimes(attributesNumber -1, (n) => {
                    const attribute = attributes[n]
                    const attributePartsNumber = attribute.length
                    if (attributePartsNumber > 0 && attributePartsNumber < 3) {
                        const name = attribute[0]
                        if (attributePartsNumber === 1) {
                            switch (name) {
                                case attributesNames.secure:
                                    cookie["secure"] = true
                                    break
                                case attributesNames.httpOnly:
                                    cookie["httpOnly"] = true
                                    break
                                case attributesNames.partitioned:
                                    cookie["partitioned"] = true
                                    break
                            }
                        }
                        else {
                            const value = attribute[1]
                            switch (name) {
                                case attributesNames.domain:
                                    cookie["domain"] = value
                                    break
                                case attributesNames.path:
                                    cookie["path"] = value
                                    break
                                case attributesNames.sameSite:
                                    if (value === sameSiteValues.lax || value === sameSiteValues.none || value === sameSiteValues.strict)
                                        cookie["sameSite"] = value
                                    break
                                case attributesNames.expires:
                                    cookie["expires"] = new Date(value)
                                    break
                                case attributesNames.maxAge:
                                    const maxAge = +value
                                    if (!isNaN(maxAge))
                                        cookie["maxAge"] = maxAge
                                    break
                            }
                        }
                    }
                })
                cookies.push(cookie)
            }
        }
    }
    return cookies
}