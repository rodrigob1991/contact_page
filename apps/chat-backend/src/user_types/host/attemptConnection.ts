import {AttemptConnection, GetResponseCookies} from "../types"
import {getHostIfValidRegistered} from "./authentication"
import {userTypes} from "chat-common/src/model/constants"
import {Host} from "chat-common/src/model/types"
import {HostAuthenticationError} from "../../errors/authentication"

const cookieNamePrefix = userTypes.host
export const attemptConnection: AttemptConnection<"host"> = async (cookies, addConnectedHost) => {
    let id
    let host: Host | undefined
    let index = 0
    while (index < cookies.length && !host) {
        const {name, value} = cookies[index]
        if (name.startsWith(cookieNamePrefix)) {
            id = +name.substring(cookieNamePrefix.length)
            if (!isNaN(id)) {
                host = await getHostIfValidRegistered(id, value)
            }
        }
        index++
    }
    if (!host)
        throw new HostAuthenticationError("valid data was not found in cookies", id)

    return addConnectedHost(host.id).then(({date}) => ({...(host as Host), date}))
}
export const getResponseCookies: GetResponseCookies = () => {
    return []
}