"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostAuthenticationError = exports.AuthenticationError = void 0;
const app_1 = require("./app");
class AuthenticationError extends app_1.AppError {
    constructor(message, userType, userId) {
        super(message, userType, userId);
    }
}
exports.AuthenticationError = AuthenticationError;
class HostAuthenticationError extends AuthenticationError {
    constructor(message, hostId) {
        super(message, "host", hostId);
    }
}
exports.HostAuthenticationError = HostAuthenticationError;
