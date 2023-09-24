import {
    emptyGuess,
    emptyHost,
    messageFlows,
    messageParts,
    messagePrefixesIn,
    messagePrefixesOut,
    userTypes
} from "./constants"
import {ChangePropertiesType, IfAllIn} from "utils/src/types"

export type UserType = keyof typeof userTypes
export type User<T extends UserType=UserType> = {type: T, data: ("host" extends T ? Host : never) | ("guess" extends T ? Guess : never)}
export type Host = typeof emptyHost
export type Guess = ChangePropertiesType<typeof emptyGuess, [["id", number | undefined], ["name", string | undefined]]>

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
export type MessagePartsValues = MessageParts[MessagePartsKeys]