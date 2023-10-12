import {userTypes} from "chat-common/src/model/constants"
import {CookiesOut, ExtractUserData, panic} from "../../app"
import {getHostIfValidRegistered} from "./authentication"

const cookieNamePrefix = userTypes.host

export const getHostCookies = (): CookiesOut => {
    return []
}

export const extractHostData: ExtractUserData<"host"> = async (cookies) => {
    let index = 0
    let host
    while (index < cookies.length && !host) {
        const {name, value} = cookies[index]
        if (name.startsWith(cookieNamePrefix)) {
            const id = +name.substring(cookieNamePrefix.length)
            if (!isNaN(id)) {
                host = await getHostIfValidRegistered(id, value).catch((r: string) => panic(r, "host", id))
            }
        }
        index++
    }
    if (!host)
        panic("could not found valid authentication cookies", "host")

    return host as { id: number, name: string, password: string }
}