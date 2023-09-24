import {paths, userTypes} from "chat-common/src/model/constants"
import {CookiesOut, ExtractUserData} from "../../app"
import {decrypt, encrypt} from "utils/src/security"
import { Guess } from "chat-common/src/model/types"

const cookieName = userTypes.guess
export const getGuessCookies = (id: number): CookiesOut => [{
    name: cookieName,
    value: encrypt(process.env.ENCRIPTION_SECRET_KEY as string, id.toString()),
    path: paths.guess,
    secure: true,
    samesite: "none",
    // roughly one year
    maxage: 60 * 60 * 24 * 30 * 12
}]

export const extractGuessData: ExtractUserData<"guess"> = async (cookies) => {
    const guess: Guess = {id: undefined, name: undefined}
    let found = false
    let index = 0
    while (index < cookies.length && !found) {
        const {name, value} = cookies[index]
        if (name === cookieName) {
            found = true
            const decryptedId = decrypt(process.env.ENCRIPTION_SECRET_KEY as string, value)
            if (decryptedId.succeed) {
                guess.id = parseInt(decryptedId.output)
            }
        }
        index++
    }
    return Promise.resolve(guess)
}