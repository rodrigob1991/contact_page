import {AttemptConnection} from "../types"
import {getHostIfValidRegistered} from "./authentication"
import {panic} from "../../app"
import {userTypes} from "chat-common/src/model/constants"
import {Host} from "chat-common/src/model/types"
import { Cookies } from "utils/src/http/cookies"

const cookieNamePrefix = userTypes.host
export const attemptConnection: AttemptConnection<"host"> = async (cookies, addConnectedHost) => {
    let index = 0
    let host: Host | undefined
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

    return addConnectedHost((host as Host).id).then(({id, date}) => ({...(host as Host), date}))
}
export const getCookies = (): Cookies => {
    return []
}