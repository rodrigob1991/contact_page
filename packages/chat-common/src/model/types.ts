import {messageFlows, messagePrefixes, users, messageParts} from "./constants"

export type UserType = typeof users[keyof typeof users]
export type TheOtherUserType<UT extends UserType> = UserType extends UT ? UserType : Exclude<UserType, UT>
export type MessageFlow = typeof messageFlows[keyof typeof messageFlows]
export type MessagePrefix<MF extends MessageFlow = MessageFlow> =
    typeof messagePrefixes["mes" | "uack"]
    | ("out" extends MF ? typeof messagePrefixes["con" | "dis" | "sack"] : never)
export type OriginPrefix = Exclude<MessagePrefix, "sack">
export type MessageParts = { [messageParts.prefix]: MessagePrefix, [messageParts.originPrefix]: OriginPrefix, [messageParts.number]: number, [messageParts.userId]: number, [messageParts.body]: string }
export type MessagePartsKeys = keyof MessageParts