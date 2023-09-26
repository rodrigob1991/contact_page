import {
    OutboundToHostMesMessage as OutboundToHostMesMessageImp,
    OutboundToHostGuessesMessage as OutboundToHostGuessesMessageImp,
    OutboundToHostConMessage as OutboundToHostConMessageImp,
    OutboundToHostDisMessage as OutboundToHostDisMessageImp,
    OutboundToHostUserAckMessage as OutboundToHostUserAckMessageImp,
    OutboundToHostServerAckMessage as OutboundToHostServerAckMessageImp,
    OutboundToGuessHostsMessage as OutboundToGuessHostsMessageImp,
    OutboundToGuessMesMessage as OutboundToGuessMesMessageImp,
    OutboundToGuessConMessage as OutboundToGuessConMessageImp,
    OutboundToGuessDisMessage as OutboundToGuessDisMessageImp,
    OutboundToGuessUserAckMessage as OutboundToGuessUserAckMessageImp,
    OutboundToGuessServerAckMessage as OutboundToGuessServerAckMessageImp,
    OutboundMesMessage as OutboundMesMessageImp,
    OutboundUserAckMessage as OutboundUserAckMessageImp,
    OutboundServerAckMessage as OutboundServerAckMessageImp,
    OutboundUsersMessage as OutboundUsersMessageImp,
    OutboundConMessage as OutboundConMessageImp,
    OutboundDisMessage as OutboundDisMessageImp,
    OutboundMessage as OutboundMessageImp,
    OutboundMessagePartsKeys as OutboundMessagePartsKeysImp,
    OutboundMessageTemplate as OutboundMessageTemplateImp,
    InboundFromHostMesMessage as InboundFromHostMesMessageImp,
    InboundFromHostAckMessage as InboundFromHostAckMessageImp,
    InboundFromGuessMesMessage as InboundFromGuessMesMessageImp,
    InboundFromGuessAckMessage as InboundFromGuessAckMessageImp,
    InboundMesMessage as InboundMesMessageImp,
    InboundAckMessage as InboundAckMessageImp,
    InboundMessage as InboundMessageImp,
    InboundMessagePartsKeys as InboundMessagePartsKeysImp,
    InboundMessageTemplate as InboundMessageTemplateImp,
    Message as MessageImp,
    MessagePartsPositions as MessagePartsPositionsImp,
    MessageTemplate as MessageTemplateImp,
    GetMessages, GotAllMessageParts, GotMessageParts
} from "chat-common/src/message/types"
import {MessageFlow, MessagePrefix as MessagePrefixImp, OriginPrefix, UserType} from "chat-common/src/model/types"

export type MessagePrefix<MF extends MessageFlow=MessageFlow> = MessagePrefixImp<MF extends "in" ? "out" : MF extends "out" ? "in" : MF>

export type InboundToHostMesMessage = OutboundToHostMesMessageImp
export type InboundToHostGuessesMessage = OutboundToHostGuessesMessageImp
export type InboundToHostConMessage = OutboundToHostConMessageImp
export type InboundToHostDisMessage = OutboundToHostDisMessageImp
export type InboundToHostUserAckMessage = OutboundToHostUserAckMessageImp
export type InboundToHostServerAckMessage = OutboundToHostServerAckMessageImp
export type InboundToHostMessage = InboundToHostMesMessage | InboundToHostGuessesMessage | InboundToHostConMessage | InboundToHostDisMessage | InboundToHostUserAckMessage | InboundToHostServerAckMessage

export type InboundToGuessMesMessage = OutboundToGuessMesMessageImp
export type InboundToGuessHostsMessage = OutboundToGuessHostsMessageImp
export type InboundToGuessConMessage = OutboundToGuessConMessageImp
export type InboundToGuessDisMessage = OutboundToGuessDisMessageImp
export type InboundToGuessUserAckMessage = OutboundToGuessUserAckMessageImp
export type InboundToGuessServerAckMessage = OutboundToGuessServerAckMessageImp
export type InboundToGuessMessage = InboundToGuessMesMessage | InboundToGuessHostsMessage | InboundToGuessConMessage | InboundToGuessDisMessage | InboundToGuessUserAckMessage | InboundToGuessServerAckMessage

export type  InboundMesMessage<UT extends UserType> = OutboundMesMessageImp<UT>
export type  InboundUserAckMessage<UT extends UserType> = OutboundUserAckMessageImp<UT>
export type  InboundServerAckMessage<UT extends UserType> = OutboundServerAckMessageImp<UT>
export type  InboundUsersMessage<UT extends UserType> = OutboundUsersMessageImp<UT>
export type  InboundConMessage<UT extends UserType> = OutboundConMessageImp<UT>
export type  InboundDisMessage<UT extends UserType> = OutboundDisMessageImp<UT>
export type  InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageImp<UT,MP>
export type  InboundMessagePartsKeys = OutboundMessagePartsKeysImp
export type  InboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = OutboundMessageTemplateImp<UT,MP>

export type  OutboundFromHostMesMessage = InboundFromHostMesMessageImp
export type  OutboundFromHostAckMessage<OP extends OriginPrefix = OriginPrefix> = InboundFromHostAckMessageImp<OP>

export type  OutboundFromGuessMesMessage = InboundFromGuessMesMessageImp
export type  OutboundFromGuessAckMessage<OP extends OriginPrefix = OriginPrefix> = InboundFromGuessAckMessageImp<OP>

export type  OutboundMesMessage<UT extends UserType=UserType> = InboundMesMessageImp<UT>
export type  OutboundAckMessage<UT extends UserType=UserType, OP extends OriginPrefix = OriginPrefix>  = InboundAckMessageImp<UT, OP>
export type  OutboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">>  = InboundMessageImp<UT, MP>
export type  OutboundMessagePartsKeys = InboundMessagePartsKeysImp
export type  OutboundMessageTemplate<UT extends UserType = UserType, MP extends MessagePrefix<"out"> = MessagePrefix<"out">> = InboundMessageTemplateImp<UT, MP>

export type InboundUsersMessageParts<UT extends UserType> = GotAllMessageParts<InboundUsersMessage<UT>>
export type InboundConMessageParts<UT extends UserType> = GotAllMessageParts<InboundConMessage<UT>>
export type InboundDisMessageParts<UT extends UserType> = GotAllMessageParts<InboundDisMessage<UT>>
export type InboundMesMessageParts<UT extends UserType> = GotAllMessageParts<InboundMesMessage<UT>>
export type InboundUserAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundUserAckMessage<UT>>
export type InboundServerAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundServerAckMessage<UT>>
export type InboundMessageParts<UT extends UserType=UserType> = GotAllMessageParts<InboundMessage<UT>>