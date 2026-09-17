import { ResponseCookie } from "../../response/headers/cookies";
export type RequestCookie = Pick<ResponseCookie, "name" | "value">;
export type RequestCookies = RequestCookie[];
export declare const getRequestCookie: ({ name, value }: RequestCookie) => string;
export declare const getRequestCookieHeader: (...cookies: RequestCookies) => string;
export declare const parseRequestCookies: (...cookiesStr: string[]) => RequestCookies;
