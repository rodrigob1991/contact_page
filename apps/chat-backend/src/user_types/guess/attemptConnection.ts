import {AttemptConnection} from "../types"
import {paths, userTypes} from "chat-common/src/model/constants"
import { Cookies } from "utils/src/http/cookies"
import {decrypt, encrypt} from "utils/src/security"

const cookieName = userTypes.guess
export const attemptConnection: AttemptConnection<"guess"> = async (cookies, addConnectedGuess) => {
    let cookieId = undefined
    let found = false
    let index = 0
    while (index < cookies.length && !found) {
        const {name, value} = cookies[index]
        if (name === cookieName) {
            found = true
            const decryptedId = decrypt(process.env.ENCRIPTION_SECRET_KEY as string, value)
            if (decryptedId.succeed) {
                cookieId = parseInt(decryptedId.output)
            }
        }
        index++
    }
    return addConnectedGuess(cookieId).then(({id, date}) => ({id, name: "guess" + id, date}))
}

export const getCookies = (id: number): Cookies => [{
    name: cookieName,
    value: encrypt(process.env.ENCRIPTION_SECRET_KEY as string, id.toString()),
    path: paths.guess,
    secure: true,
    sameSite: "None",
    // roughly one year
    maxAge: 60 * 60 * 24 * 30 * 12
}]