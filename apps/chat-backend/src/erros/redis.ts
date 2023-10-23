import {RedisClientFunctionName} from "../redis"

export class RedisError extends Error {
    origin: RedisClientFunctionName

    constructor(origin: RedisClientFunctionName, message: string) {
        super(message)
        this.origin = origin
    }
}