import {recursiveSplit} from "../../../strings"
import {ResponseCookie} from "../../response/headers/cookies"

export type RequestCookie = Pick<ResponseCookie, "name" | "value">
export type RequestCookies = RequestCookie[]

export const getRequestCookie = ({name, value}: RequestCookie) => name + "=" + value
export const getRequestCookieHeader = (...cookies: RequestCookies) => "Cookie:" + cookies.map((cookie) => getRequestCookie(cookie)).join(";")
export const parseRequestCookies = (...cookiesStr: string[]) => {
    const cookies: RequestCookies = []
    for (const cookieStr of cookiesStr) {
        const namesValues = recursiveSplit(cookieStr, [";", "="])
        for (const nameValue of namesValues) {
            if (nameValue.length === 2)
                cookies.push({name: nameValue[0], value: nameValue[1]})
        }
    }
    return cookies
}