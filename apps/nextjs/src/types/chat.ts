import {
    OutboundToHostMesMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostAckMessage,
    OutboundToGuessMesMessage,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessAckMessage,
    OutboundMesMessage,
    OutboundAckMessage,
    OutboundConMessage,
    OutboundDisMessage,
    OutboundMessage,
    OutboundMessageParts,
    OutboundMessageTemplate,
    InboundFromHostMesMessage,
    InboundFromHostAckMessage,
    InboundFromGuessMesMessage,
    InboundFromGuessAckMessage,
    InboundMesMessage,
    InboundAckMessage,
    InboundMessage,
    InboundMessageParts,
    InboundMessageTemplate,
    Message,
    MessagePartsPositions,
    MessageTemplate,
    GetMessages, GotAllMessageParts, GotMessageParts
} from "chat-common/src/message/types"
import {UserType} from "chat-common/model/types";

export type InboundToHostMesMessage = OutboundToHostMesMessage
export type InboundToHostConMessage = OutboundToHostConMessage
export type  InboundToHostDisMessage = OutboundToHostDisMessage
export type  InboundToHostAckMessage = OutboundToHostAckMessage
export type InboundToHostMessage = InboundToHostMesMessage | InboundToHostConMessage | InboundToHostDisMessage | InboundToHostAckMessage
export type  InboundToGuessMesMessage = OutboundToGuessMesMessage
export type  InboundToGuessConMessage = OutboundToGuessConMessage
export type  InboundToGuessDisMessage = OutboundToGuessDisMessage
export type  InboundToGuessAckMessage = OutboundToGuessAckMessage
export type InboundToGuessMessage = InboundToGuessMesMessage | InboundToGuessConMessage | InboundToGuessDisMessage | InboundToGuessAckMessage
export type  InboundMesMessage = OutboundMesMessage
export type  InboundAckMessage = OutboundAckMessage
export type  InboundConMessage = OutboundConMessage
export type  InboundDisMessage = OutboundDisMessage
export type InboundMesMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostMesMessage : InboundToGuessMesMessage
export type InboundAckMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostAckMessage : InboundToGuessAckMessage
export type InboundConMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostConMessage : InboundToGuessConMessage
export type InboundDisMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostDisMessage : InboundToGuessDisMessage
export type  InboundMessage = OutboundMessage
export type  InboundMessageParts = OutboundMessageParts
export type  InboundMessageTemplate = OutboundMessageTemplate

export type  OutboundFromHostMesMessage = InboundFromHostMesMessage
export type  OutboundFromHostAckMessage = InboundFromHostAckMessage
export type  OutboundFromGuessMesMessage = InboundFromGuessMesMessage
export type  OutboundFromGuessAckMessage = InboundFromGuessAckMessage
export type  OutboundMesMessage = InboundMesMessage
export type  OutboundAckMessage = InboundAckMessage
export type  OutboundMessage = InboundMessage
export type  OutboundMessageParts = InboundMessageParts
export type  OutboundMessageTemplate = InboundMessageTemplate

export type InboundConMessageParts<UT extends UserType> = GotAllMessageParts<InboundConMessageUser<UT>>
export type InboundDisMessageParts<UT extends UserType> = GotAllMessageParts<InboundDisMessageUser<UT>>
export type InboundMesMessageParts<UT extends UserType> = GotAllMessageParts<InboundMesMessageUser<UT>>
export type InboundAckMessageParts<UT extends UserType> = GotAllMessageParts<InboundAckMessageUser<UT>>