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
    GetMessages
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
export type InboundMessageUser<UT extends UserType> = UT extends "host" ? InboundToHostMessage : InboundToGuessMessage
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