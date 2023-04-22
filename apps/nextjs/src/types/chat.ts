import {
    OutboundToHostMesMessage as OutboundToHostMesMessageImp,
    OutboundToHostConMessage as OutboundToHostConMessageImp,
    OutboundToHostDisMessage as OutboundToHostDisMessageImp,
    OutboundToHostUserAckMessage as OutboundToHostUserAckMessageImp,
    OutboundToHostServerAckMessage as OutboundToHostServerAckMessageImp,
    OutboundToGuessMesMessage as OutboundToGuessMesMessageImp,
    OutboundToGuessConMessage as OutboundToGuessConMessageImp,
    OutboundToGuessDisMessage as OutboundToGuessDisMessageImp,
    OutboundToGuessUserAckMessage as OutboundToGuessUserAckMessageImp,
    OutboundToGuessServerAckMessage as OutboundToGuessServerAckMessageImp,
    OutboundMesMessage as OutboundMesMessageImp,
    OutboundUserAckMessage as OutboundUserAckMessageImp,
    OutboundServerAckMessage as OutboundServerAckMessageImp,
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
export type  InboundToHostUserAckMessage = OutboundToHostUserAckMessageImp
export type  InboundToHostServerAckMessage = OutboundToHostServerAckMessageImp
export type InboundToHostMessage = InboundToHostMesMessage | InboundToHostConMessage | InboundToHostDisMessage | InboundToHostUserAckMessage | InboundToHostServerAckMessage
export type  InboundToGuessMesMessage = OutboundToGuessMesMessageImp
export type  InboundToGuessConMessage = OutboundToGuessConMessageImp
export type  InboundToGuessDisMessage = OutboundToGuessDisMessageImp
export type  InboundToGuessUserAckMessage = OutboundToGuessUserAckMessageImp
export type  InboundToGuessServerAckMessage = OutboundToGuessServerAckMessageImp
export type InboundToGuessMessage = InboundToGuessMesMessage | InboundToGuessConMessage | InboundToGuessDisMessage | InboundToGuessUserAckMessage | InboundToGuessServerAckMessage
export type  InboundMesMessage<UT extends UserType> = OutboundMesMessageImp<UT>
export type  InboundUserAckMessage<UT extends UserType> = OutboundUserAckMessageImp<UT>
export type  InboundServerAckMessage<UT extends UserType> = OutboundServerAckMessageImp<UT>
export type  InboundConMessage<UT extends UserType> = OutboundConMessageImp<UT>
export type  InboundDisMessage<UT extends UserType> = OutboundDisMessageImp<UT>
export type  InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageImp<UT,MP>
export type  InboundMessageParts = OutboundMessagePartsImp
export type  InboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageTemplateImp<UT,MP>

export type  OutboundFromHostMesMessage = InboundFromHostMesMessageImp
export type  OutboundFromHostAckMessage = InboundFromHostAckMessageImp
export type  OutboundFromGuessMesMessage = InboundFromGuessMesMessageImp
export type  OutboundFromGuessAckMessage = InboundFromGuessAckMessageImp
export type  OutboundMesMessage<UT extends UserType=UserType> = InboundMesMessageImp<UT>
export type  OutboundAckMessage<UT extends UserType=UserType>  = InboundAckMessageImp<UT>
export type  OutboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">>  = InboundMessageImp<UT, MP>
export type  OutboundMessageParts = InboundMessagePartsImp
export type  OutboundMessageTemplate<UT extends UserType = UserType, MP extends MessagePrefix<"out"> = MessagePrefix<"out">> = InboundMessageTemplateImp<UT, MP>

export type InboundConMessageParts<UT extends UserType> = GotAllMessageParts<InboundConMessage<UT>>
export type InboundDisMessageParts<UT extends UserType> = GotAllMessageParts<InboundDisMessage<UT>>
export type InboundMesMessageParts<UT extends UserType> = GotAllMessageParts<InboundMesMessage<UT>>
export type InboundUserAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundUserAckMessage<UT>>
export type InboundServerAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundServerAckMessage<UT>>