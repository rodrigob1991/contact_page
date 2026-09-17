import {AppError} from "./app"
import {UserType} from "chat-common/src/model/types"

export class AuthenticationError extends AppError {
    constructor(message: string, userType: UserType, userId?: number) {
        super(message, userType, userId)
    }
}

export class HostAuthenticationError extends AuthenticationError {
    constructor(message: string, hostId?: number) {
        super(message, "host", hostId)
    }
}
