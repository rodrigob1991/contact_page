import {UserType} from "chat-common/src/model/types"

export class AppError extends Error {
    userType: UserType
    userId?: number

    constructor(message: string, userType: UserType, userId?: number) {
        super(message)
        this.userType = userType
        this.userId = userId
    }
}