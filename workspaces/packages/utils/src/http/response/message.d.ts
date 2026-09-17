import { Version } from "../versions";
import { StatusCode } from "./statuses";
export declare const getResponseMessage: (version: Version, statusCode: StatusCode, headers?: string[], body?: string) => string;
