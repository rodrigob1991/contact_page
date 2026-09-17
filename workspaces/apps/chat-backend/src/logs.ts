import {UserType} from "chat-common/src/model/types"

export const getStandardMessage = (msg: string, userType?: UserType, userId?: number) =>
    (userType ? (userType + (userId === undefined ? "" : " " + userId)) + ": " : "") + msg + " : " + new Date().toString()
export const log = (msg: string, userType?: UserType, userId?: number) => {
    console.log(getStandardMessage(msg, userType, userId))
}
export const logError = (msg: string, userType?: UserType, userId?: number) => {
    console.error(getStandardMessage(msg, userType, userId))
}
