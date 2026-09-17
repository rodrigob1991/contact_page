"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponseMessage = void 0;
const statuses_1 = require("./statuses");
const syntax_1 = require("../syntax");
const getResponseMessage = (version, statusCode, headers, body) => `${syntax_1.id}version ${statusCode} ${statuses_1.statuses[statusCode]}${syntax_1.crlf}${(headers && headers.length > 0) ? headers.join(syntax_1.crlf) : ""}${syntax_1.crlf}${body || ""}`;
exports.getResponseMessage = getResponseMessage;
