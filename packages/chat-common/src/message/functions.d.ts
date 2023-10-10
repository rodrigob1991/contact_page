import { CommonMessagePartsPositions, GotAllMessageParts, GotMessageParts, Message, MessagePartsPositions } from "./types";
import { AccountedUserData } from "../model/types";
type AnyMessagePartsPositions<M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP = M["positions"]> = {
    [K in CMPP]: K extends keyof MPP ? MPP[K] : never;
};
type LastPosition<MPP extends MessagePartsPositions, LASTS = [4, 3, 2, 1]> = LASTS extends [infer LAST, ...infer REST] ? LAST extends MPP[keyof MPP] ? LAST : LastPosition<MPP, REST> : never;
export declare const getMessage: <M extends Message>(parts: GotAllMessageParts<M>) => M["template"];
export declare const getPrefix: <M extends `con:${number}:${number}:${string}` | `dis:${number}:${number}:${string}` | `mes:${number}:${number}:${string}` | `uack:${number}:${number}` | `sack:${number}:${number}` | `uack:mes:${number}:${number}` | `uack:uack:${number}:${number}` | `uack:con:${number}:${number}` | `uack:dis:${number}:${number}` | `uack:usrs:${number}` | `usrs:${number}:${string}`>(m: M) => M extends `${infer MP}:${string}` ? MP : never;
export declare const getOriginPrefix: <M extends `uack:mes:${number}:${number}` | `uack:uack:${number}:${number}` | `uack:con:${number}:${number}` | `uack:dis:${number}:${number}` | `uack:usrs:${number}`>(m: M) => M extends `${string}:${infer OP}:${string}` ? OP : never;
export declare const getParts: <M extends Message, CMPP extends CommonMessagePartsPositions<M> = CommonMessagePartsPositions<M>>(m: M["template"], whatGet: AnyMessagePartsPositions<M, CMPP, M["positions"]>) => GotMessageParts<M, CMPP>;
export declare const getCutMessage: <M extends Message, CMPP extends CommonMessagePartsPositions<M>, MPP extends M["positions"] = M["positions"]>(m: M["template"], whatCut: AnyMessagePartsPositions<M, CMPP, M["positions"]>, lastPosition: 4 extends infer T ? T extends 4 ? T extends MPP[keyof MPP] ? T : 3 extends infer T_1 ? T_1 extends 3 ? T_1 extends MPP[keyof MPP] ? T_1 : 2 extends infer T_2 ? T_2 extends 2 ? T_2 extends MPP[keyof MPP] ? T_2 : 1 extends infer T_3 ? T_3 extends 1 ? T_3 extends MPP[keyof MPP] ? T_3 : never : never : never : never : never : never : never : never : never) => M extends Message<"host" | "guess", "in" | "out", import("../model/types").MessagePrefix<"in" | "out">> ? `${M["prefix"]}${"originPrefix" extends infer T_4 ? T_4 extends "originPrefix" ? T_4 extends Exclude<M["parts"], CMPP> ? `:${M["originPrefix"]}` : "" : never : never}${"number" extends infer T_5 ? T_5 extends "number" ? T_5 extends Exclude<M["parts"], CMPP> ? `:${number}` : "" : never : never}${"userId" extends infer T_6 ? T_6 extends "userId" ? T_6 extends Exclude<M["parts"], CMPP> ? `:${number}` : "" : never : never}${"body" extends infer T_7 ? T_7 extends "body" ? T_7 extends Exclude<M["parts"], CMPP> ? `:${string}` : "" : never : never}` : never;
export declare const getUsersMessageBody: (usersData: [
    number,
    string,
    boolean,
    number?
][]) => string;
export declare const getParsedUsersMessageBody: (body: string) => AccountedUserData[];
export {};
