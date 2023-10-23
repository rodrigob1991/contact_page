import {Version} from "../versions"
import {statuses, Status} from "./statuses"
import {crlf, id} from "../syntax"

export const getResponseMessage = (version: Version, status: Status, headers?: string[], body?: string) =>
    `${id}version ${status} ${statuses[status]}${crlf}${(headers && headers.length > 0) ? headers.join(crlf) : ""}${crlf}${body || ""}`

