import {
    MessageFlow,
    MessageParts,
    MessagePartsKeys,
    MessagePrefix,
    MessagePrefixExclusiveOut,
    OriginPrefix,
    TheOtherUserType,
    UserType
} from "../model/types"
import {IfOneIn} from "utils/src/types"

// HERE IS WHERE IS ESTABLISHED WHAT PARTS EACH MESSAGE HAS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SpecificMessagePartsKeys<UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>, OP extends OriginPrefix<MF, MP>> =
    "prefix"
    | IfOneIn<OriginPrefix, OP, "originPrefix">
   // | IfAllIn<"in" | "uack", MF | MP, "originPrefix">
    | "number"
    | IfOneIn<"con" | "dis" | "mes" | IfOneIn<Exclude<OriginPrefix, "usrs"> | "out", OP | MF, "uack"> | "sack", MP, "userId">
    | IfOneIn<"mes" | "usrs" | "con", MP, "body">

type PartTemplate<MPK extends MessagePartsKeys, MPKS extends MessagePartsKeys, S extends ":" | "", MPT extends MessageParts[MPK]=MessageParts[MPK]> = MPK extends MPKS ? `${S}${MPT}` : ""
type MessageTemplateInstance<MF extends MessageFlow, MP extends MessagePrefix<MF>, OP extends OriginPrefix<MF, MP>, MPKS extends MessagePartsKeys> =
    `${MP}${PartTemplate<"originPrefix", MPKS, ":", OP>}${PartTemplate<"number", MPKS, ":">}${PartTemplate<"userId", MPKS, ":">}${PartTemplate<"body", MPKS, ":">}`

export type CutMessage<M extends Message[], WC extends MessagePartsKeys> = M extends [infer OM, ...infer RM] ? OM extends Message ? MessageTemplateInstance<OM["flow"], OM["prefix"], OM["origin"], Exclude<OM["parts"], WC>> | (RM extends Message[] ? CutMessage<RM, WC> : never) : never : never

type SpecificMessagePartsPositions<SMPK extends MessagePartsKeys> = Pick<{ prefix: 1, originPrefix: 2, number: "originPrefix" extends SMPK ? 3 : 2, userId: "originPrefix" extends SMPK ? 4 : 3, body: "userId" extends SMPK ? 4 : 3 }, SMPK>

type MessageInstance<UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>, OP extends OriginPrefix<MF, MP> = OriginPrefix<MF, MP>, SMPK extends SpecificMessagePartsKeys<UT, MF, MP, OP> = SpecificMessagePartsKeys<UT, MF, MP, OP>> = { userType: UT, flow: MF, prefix: MP, origin: OP, parts: SMPK, positions: SpecificMessagePartsPositions<SMPK>, template: MessageTemplateInstance<MF, MP, OP, SMPK> }
type MessageInstanceUserAck<UT extends UserType, OP extends OriginPrefix> = { [K in OP]: MessageInstance<UT, "in", "uack", K> }[OP]

export type OutboundToHostMesMessage = MessageInstance<"host", "out", "mes">
export type OutboundToHostConMessage = MessageInstance<"host", "out", "con">
export type OutboundToHostDisMessage = MessageInstance<"host", "out", "dis">
export type OutboundToHostServerAckMessage = MessageInstance<"host", "out", "sack">
export type OutboundToHostUserAckMessage = MessageInstance<"host", "out", "uack">
export type OutboundToHostGuessesMessage = MessageInstance<"host", "out", "usrs">

export type OutboundToGuessMesMessage = MessageInstance<"guess", "out", "mes">
export type OutboundToGuessConMessage = MessageInstance<"guess", "out", "con">
export type OutboundToGuessDisMessage = MessageInstance<"guess", "out", "dis">
export type OutboundToGuessServerAckMessage = MessageInstance<"guess", "out", "sack">
export type OutboundToGuessUserAckMessage = MessageInstance<"guess", "out", "uack">
export type OutboundToGuessHostsMessage = MessageInstance<"guess", "out", "usrs">

export type OutboundMesMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostMesMessage : never) | ("guess" extends UT ? OutboundToGuessMesMessage : never)
export type OutboundServerAckMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostServerAckMessage : never) | ("guess" extends UT ? OutboundToGuessServerAckMessage : never)
export type OutboundUserAckMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostUserAckMessage : never) | ("guess" extends UT ? OutboundToGuessUserAckMessage : never)
export type OutboundConMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostConMessage : never) | ("guess" extends UT ? OutboundToGuessConMessage : never)
export type OutboundDisMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostDisMessage : never) | ("guess" extends UT ? OutboundToGuessDisMessage : never)
export type OutboundUsersMessage<UT extends UserType=UserType> = ("host" extends UT ? OutboundToHostGuessesMessage : never) | ("guess" extends UT ? OutboundToGuessHostsMessage : never)

export type OutboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = ("con" extends MP ? OutboundConMessage<UT> : never) | ("dis" extends MP ? OutboundDisMessage<UT>: never)  | ("mes" extends MP ? OutboundMesMessage<UT>: never)  | ("sack" extends MP ? OutboundServerAckMessage<UT>: never) | ("uack" extends MP ? OutboundUserAckMessage<UT>: never) | ("usrs" extends MP ? OutboundUsersMessage<UT>: never)
export type OutboundMessagePartsKeys<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = OutboundMessage<UT, MP>["parts"]
export type OutboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"out">=MessagePrefix<"out">> = OutboundMessage<UT, MP>["template"]

export type InboundFromHostMesMessage = MessageInstance<"host","in","mes">
export type InboundFromHostAckMessage<OP extends OriginPrefix = OriginPrefix> = MessageInstanceUserAck<"host", OP>

export type InboundFromGuessMesMessage = MessageInstance<"guess","in","mes">
export type InboundFromGuessAckMessage<OP extends OriginPrefix = OriginPrefix> = MessageInstanceUserAck<"guess", OP>

export type InboundMesMessage<UT extends UserType=UserType> =   ("host" extends UT ? InboundFromHostMesMessage : never)  | ("guess" extends UT ? InboundFromGuessMesMessage : never)
export type InboundAckMessage<UT extends UserType=UserType, OP extends OriginPrefix=OriginPrefix> = ("host" extends UT ? InboundFromHostAckMessage<OP> : never) | ("guess" extends UT ? InboundFromGuessAckMessage<OP> : never)

type OriginPrefixOrNever<MP extends MessagePrefix> = "uack" extends MP ? OriginPrefix : never
export type InboundMessage<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">, OP extends OriginPrefixOrNever<MP> = OriginPrefixOrNever<MP>> =("mes" extends MP ? InboundMesMessage<UT> : never) | ("uack" extends MP ? InboundAckMessage<UT, OP> : never)
export type InboundMessagePartsKeys<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">> = InboundMessage<UT, MP>["parts"]
export type InboundMessageTemplate<UT extends UserType=UserType, MP extends MessagePrefix<"in">=MessagePrefix<"in">, OP extends OriginPrefixOrNever<MP> = OriginPrefixOrNever<MP>> = InboundMessage<UT, MP, OP>["template"]
export type InboundMessageTarget<M extends InboundMessage> = OutboundMessage<TheOtherUserType<M["userType"]>,  M["prefix"]>
export type InboundAckMessageOrigin<UT extends UserType = UserType, OP extends MessagePrefix<"out"> = MessagePrefix<"out">> = GetMessages<UT, "out", OP>

export type Message<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = ("in" extends MF ? InboundMessage<UT, Exclude<MP, MessagePrefixExclusiveOut>> : never)  | ("out" extends MF ? OutboundMessage<UT,MP> : never)
export type MessagePartsPositions<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = Message<UT, MF, MP>["positions"]
export type MessageTemplate<UT extends UserType=UserType, MF extends MessageFlow=MessageFlow, MP extends MessagePrefix<MF>=MessagePrefix<MF>> = Message<UT, MF, MP>["template"]

type FilterMessage<M extends Message, UT extends UserType, MF extends MessageFlow, MP extends MessagePrefix<MF>> = M["userType"] | M["flow"] | M["prefix"] extends UT | MF | MP ? [M] : []
export type GetMessages<UT extends UserType = UserType, MF extends MessageFlow = MessageFlow, MP extends MessagePrefix<MF> = MessagePrefix<MF>> = [...FilterMessage<OutboundToHostMesMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostConMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostDisMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostServerAckMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostUserAckMessage, UT, MF, MP>,
    ...FilterMessage<OutboundToGuessMesMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessConMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessDisMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessServerAckMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessUserAckMessage, UT, MF, MP>, ...FilterMessage<OutboundToHostGuessesMessage, UT, MF, MP>, ...FilterMessage<OutboundToGuessHostsMessage, UT, MF, MP>,...FilterMessage<InboundFromHostMesMessage, UT, MF, MP>, ...FilterMessage<InboundFromHostAckMessage, UT, MF, MP>,
    ...FilterMessage<InboundFromGuessMesMessage, UT, MF, MP>, ...FilterMessage<InboundFromGuessAckMessage, UT, MF, MP>]

type IfUniquePosition<P, K> = { [N in 1 | 2 | 3 | 4]: N extends P ? Exclude<P, N> extends never ? K : never : never }[1 | 2 | 3 | 4]
export type CommonMessagePartsPositions<M extends Message, MPP = M["positions"]> = keyof { [K in M["parts"] as K extends keyof MPP ? IfUniquePosition<MPP[K], K> : never]: never }
export type GotMessageParts<M extends Message, CMPP extends CommonMessagePartsPositions<M>> = { [K in CMPP]: K extends "prefix" ? M["prefix"] : MessageParts[K] }
export type GotAllMessageParts<M extends Message> = { [K in keyof M["positions"]]: K extends "prefix" ? M["prefix"] : K extends MessagePartsKeys ? MessageParts[K] : never }