"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisError = void 0;
const app_1 = require("./app");
class RedisError extends app_1.AppError {
    constructor(origin, cause, userType, userId, info) {
        super("from redis function " + origin + (info !== undefined ? (": " + info) : "") + ", cause: " + cause, userType, userId);
        this.origin = origin;
        this.cause = cause;
    }
}
exports.RedisError = RedisError;
