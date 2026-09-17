"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, userType, userId) {
        super(message);
        this.userType = userType;
        this.userId = userId;
    }
}
exports.AppError = AppError;
