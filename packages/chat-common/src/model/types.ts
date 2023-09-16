import {
    emptyGuess,
    emptyHost,
    messageFlows,
    messageParts,
    messagePrefixesIn,
    messagePrefixesOut,
    users
} from "./constants"
import {IfAllIn} from "utils/src/types"

export type UserType = keyof typeof users
export type Host = typeof emptyHost
export type Guess = typeof emptyGuess

export type TheOtherUserType<UT extends UserType> = UserType extends UT ? UserType : Exclude<UserType, UT>
export type MessageFlow = keyof typeof messageFlows
export type MessagePrefixIn = keyof typeof messagePrefixesIn
export type MessagePrefixOut = keyof typeof messagePrefixesOut
export type MessagePrefixExclusiveOut = Exclude<MessagePrefixOut, MessagePrefixIn>
export type MessagePrefix<MF extends MessageFlow = MessageFlow> =
    ("in" extends MF ? MessagePrefixIn : never)
    | ("out" extends MF ? MessagePrefixOut : never)
export type OriginPrefix<MF extends MessageFlow = MessageFlow, MP extends MessagePrefix<MF> = MessagePrefix<MF>> = IfAllIn<"in" | "uack", MF | MP, Exclude<MessagePrefix, "sack">>
export type MessageParts = { [messageParts.prefix]: MessagePrefix, [messageParts.originPrefix]: OriginPrefix, [messageParts.number]: number, [messageParts.userId]: number, [messageParts.body]: string }
export type MessagePartsKeys = keyof MessageParts