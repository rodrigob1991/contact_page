import {RedisClientFunctionName} from "../redis"
import {AppError} from "./app"
import {UserType} from "chat-common/src/model/types"

export class RedisError<O extends RedisClientFunctionName> extends AppError {
    origin: O
    cause: string

    constructor(origin: O, cause: string, userType: UserType, userId?: number, info?: string) {
        super("from redis function " + origin + (info !== undefined ? (": " + info) : "") + ", cause: " + cause, userType, userId)
        this.origin = origin
        this.cause = cause
    }
}