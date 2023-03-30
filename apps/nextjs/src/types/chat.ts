import {
    OutboundToHostMesMessage as OutboundToHostMesMessageImp,
    OutboundToHostConMessage as OutboundToHostConMessageImp,
    OutboundToHostDisMessage as OutboundToHostDisMessageImp,
    OutboundToHostAckMessage as OutboundToHostAckMessageImp,
    OutboundToGuessMesMessage as OutboundToGuessMesMessageImp,
    OutboundToGuessConMessage as OutboundToGuessConMessageImp,
    OutboundToGuessDisMessage as OutboundToGuessDisMessageImp,
    OutboundToGuessAckMessage as OutboundToGuessAckMessageImp,
    OutboundMesMessage as OutboundMesMessageImp,
    OutboundAckMessage as OutboundAckMessageImp,
    OutboundConMessage as OutboundConMessageImp,
    OutboundDisMessage as OutboundDisMessageImp,
    OutboundMessage as OutboundMessageImp,
    OutboundMessageParts as OutboundMessagePartsImp,
    OutboundMessageTemplate as OutboundMessageTemplateImp,
    InboundFromHostMesMessage as InboundFromHostMesMessageImp,
    InboundFromHostAckMessage as InboundFromHostAckMessageImp,
    InboundFromGuessMesMessage as InboundFromGuessMesMessageImp,
    InboundFromGuessAckMessage as InboundFromGuessAckMessageImp,
    InboundMesMessage as InboundMesMessageImp,
    InboundAckMessage as InboundAckMessageImp,
    InboundMessage as InboundMessageImp,
    InboundMessageParts as InboundMessagePartsImp,
    InboundMessageTemplate as InboundMessageTemplateImp,
    Message as MessageImp,
    MessagePartsPositions as MessagePartsPositionsImp,
    MessageTemplate as MessageTemplateImp,
    GetMessages, GotAllMessageParts, GotMessageParts
} from "chat-common/src/message/types"
import {MessageFlow, MessagePrefix as MessagePrefixImp, UserType} from "chat-common/src/model/types"

export type MessagePrefix<MF extends MessageFlow=MessageFlow> = MessagePrefixImp<MF extends "in" ? "out" : MF extends "out" ? "in" : MF>
export type InboundToHostMesMessage = OutboundToHostMesMessageImp
export type InboundToHostConMessage = OutboundToHostConMessageImp
export type  InboundToHostDisMessage = OutboundToHostDisMessageImp
export type  InboundToHostAckMessage = OutboundToHostAckMessageImp
export type InboundToHostMessage = InboundToHostMesMessage | InboundToHostConMessage | InboundToHostDisMessage | InboundToHostAckMessage
export type  InboundToGuessMesMessage = OutboundToGuessMesMessageImp
export type  InboundToGuessConMessage = OutboundToGuessConMessageImp
export type  InboundToGuessDisMessage = OutboundToGuessDisMessageImp
export type  InboundToGuessAckMessage = OutboundToGuessAckMessageImp
export type InboundToGuessMessage = InboundToGuessMesMessage | InboundToGuessConMessage | InboundToGuessDisMessage | InboundToGuessAckMessage
export type  InboundMesMessage = OutboundMesMessageImp
export type  InboundAckMessage = OutboundAckMessageImp
export type  InboundConMessage = OutboundConMessageImp
export type  InboundDisMessage = OutboundDisMessageImp
export type InboundMesMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostMesMessage : InboundToGuessMesMessage
export type InboundAckMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostAckMessage : InboundToGuessAckMessage
export type InboundConMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostConMessage : InboundToGuessConMessage
export type InboundDisMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostDisMessage : InboundToGuessDisMessage
export type  InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageImp<UT,MP>
export type  InboundMessageParts = OutboundMessagePartsImp
export type  InboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageTemplateImp<UT,MP>

export type  OutboundFromHostMesMessage = InboundFromHostMesMessageImp
export type  OutboundFromHostAckMessage = InboundFromHostAckMessageImp
export type  OutboundFromGuessMesMessage = InboundFromGuessMesMessageImp
export type  OutboundFromGuessAckMessage = InboundFromGuessAckMessageImp
export type  OutboundFromUserMesMessage<UT extends UserType=UserType> = InboundMesMessageImp<UT>
export type  OutboundFromUserAckMessage<UT extends UserType=UserType>  = InboundAckMessageImp<UT>
export type  OutboundFromUserMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">>  = InboundMessageImp<UT, MP>
export type  OutboundMessageParts = InboundMessagePartsImp
export type  OutboundMessageTemplate<UT extends UserType = UserType, MP extends MessagePrefix<"out"> = MessagePrefix<"out">> = InboundMessageTemplateImp<UT, MP>

export type InboundConMessageParts<UT extends UserType> = GotAllMessageParts<InboundConMessageUser<UT>>
export type InboundDisMessageParts<UT extends UserType> = GotAllMessageParts<InboundDisMessageUser<UT>>
export type InboundMesMessageParts<UT extends UserType> = GotAllMessageParts<InboundMesMessageUser<UT>>
export type InboundAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundAckMessageUser<UT>>