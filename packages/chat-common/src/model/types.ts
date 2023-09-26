import {
    emptyGuess,
    emptyHost,
    messageFlows,
    messageParts,
    messagePrefixesIn,
    messagePrefixesOut, oppositeUserTypes,
    userTypes
} from "./constants"
import {ChangePropertiesType, IfAllIn} from "utils/src/types"

export type UserType = keyof typeof userTypes
export type User<UT extends UserType=UserType> = {type: UT, data: ("host" extends UT ? Host : never) | ("guess" extends UT ? Guess : never)}
export type AccountedUser<UT extends UserType = UserType> = {
    type: UT,
    data: (("host" extends UT ? Host : never) | ("guess" extends UT ? AccountedGuess : never)) &  { isConnected: boolean, lastConnectionDate?: number }
}
export type AccountedUserData<UT extends UserType = UserType> = AccountedUser<UT>["data"]
export type Host = typeof emptyHost
export type Guess = ChangePropertiesType<AccountedGuess, [["id", number | undefined], ["name", string | undefined]]>
export type AccountedGuess = typeof emptyGuess

export type OppositeUserType = typeof oppositeUserTypes
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