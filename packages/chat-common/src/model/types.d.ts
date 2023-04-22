import { messageFlows, messagePrefixes, users, messageParts } from "./constants";
export type UserType = typeof users[keyof typeof users];
export type MessageFlow = typeof messageFlows[keyof typeof messageFlows];
export type MessagePrefix<MF extends MessageFlow = MessageFlow> = typeof messagePrefixes["mes" | "userAck"] | ("out" extends MF ? typeof messagePrefixes["con" | "dis" | "serverAck"] : never);
export type MessageParts = {
    [messageParts.prefix]: MessagePrefix;
    [messageParts.originPrefix]: MessagePrefix<"out">;
    [messageParts.number]: number;
    [messageParts.guessId]: number;
    [messageParts.body]: string;
};
export type MessagePartsKeys = keyof MessageParts;
