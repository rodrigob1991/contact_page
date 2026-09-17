import {Version} from "../versions"
import {statuses, StatusCode} from "./statuses"
import {crlf, id} from "../syntax"

export const getResponseMessage = (version: Version, statusCode: StatusCode, headers?: string[], body?: string) =>
    `${id}version ${statusCode} ${statuses[statusCode]}${crlf}${(headers && headers.length > 0) ? headers.join(crlf) : ""}${crlf}${body || ""}`

