import {UserType} from "chat-common/src/model/types"
import {
    InboundAckMessage,
    InboundAckMessageParts,
    InboundConMessage,
    InboundConMessageParts,
    InboundDisMessage,
    InboundDisMessageParts,
    InboundMesMessage,
    InboundMesMessageParts,
    InboundMessageTemplate,
    OutboundFromGuessAckMessage,
    OutboundFromGuessMesMessage,
    OutboundFromHostAckMessage,
    OutboundFromHostMesMessage,
    OutboundFromUserAckMessage,
    OutboundFromUserMessage
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleAckMessage<UT extends UserType> =  (n: number) => void

export type GuessesIds<UT extends UserType> = UT extends "host" ? number[] : undefined
export type GuessId<UT extends UserType> = UT extends "host" ? number : undefined
export type SendMesMessage<UT extends UserType> = (number: number, body: string, guessesId: GuessesIds<UT>) => void

export type Props<UT extends UserType> = {
    userType: UT
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
    handleAckMessage: HandleAckMessage<UT>
}

export default function useWebSocket<UT extends UserType>({
                                                              userType,
                                                              handleConMessage,
                                                              handleDisMessage,
                                                              handleMesMessage,
                                                              handleAckMessage
                                                          }: Props<UT>) {
    const sendMesMessageCommon: SendMesMessageCommon = (number, mesMessage) => {
        const resendUntilAck = () => {
            (getWS() as WebSocket).send(mesMessage)
            setTimeout(() => {
                if (!isMessageAck(number)) {
                    resendUntilAck()
                }
            }, 5000)
        }
        setMessageToAck(number)
        resendUntilAck()
    }

    const [getWsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts] = userType === "host" ?
        getHostSpecifics(sendMesMessageCommon, handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)
        : getGuessSpecifics(sendMesMessageCommon, handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current

    useEffect(() => {
            const ws = new WebSocket(getWsEndpoint())
            ws.onmessage = ({data: inboundMessage}: MessageEvent<InboundMessageTemplate<UT>>) => {
                console.log("inbound message: " + inboundMessage)
                let parts
                let ack
                const prefix = getMessagePrefix(inboundMessage)
                switch (prefix) {
                    case "con":
                        [parts, ack] = getConMessageParts(inboundMessage as InboundMessageTemplate<UT, "con">)
                        handleConMessage(parts)
                        break
                    case "dis":
                        [parts, ack] = getDisMessageParts(inboundMessage as InboundMessageTemplate<UT, "dis">)
                        handleDisMessage(parts)
                        break
                    case "mes":
                        [parts, ack] = getMesMessageParts(inboundMessage as InboundMessageTemplate<UT, "mes">)
                        handleMesMessage(parts)
                        break
                    case "ack":
                        [parts, ack] = getAckMessageParts(inboundMessage as InboundMessageTemplate<UT, "ack">)
                        setMessageAlreadyAck(parts.number)
                        handleAckMessage(parts.number)
                        break
                    default:
                        throw new Error("invalid inbound message")
                }
                // acknowledged message
                ws.send(ack)
            }
            setWS(ws)

            return () => { ws.close() }
        }
        , [])

    const ackMessagesRef = useRef<boolean[]>([])
    const getAckMessages = () => ackMessagesRef.current
    const setMessageToAck = (n: number) => { getAckMessages()[n] = false }
    const setMessageAlreadyAck = (n: number) => { getAckMessages()[n] = true }
    const isMessageAck = (n: number) => getAckMessages()[n]

    return sendMesMessage
}

type SendMesMessageCommon = (number: number, mesMessage: OutboundFromUserMessage["template"]) => void
type GetConMessageParts<UT extends UserType> = (icm: InboundMessageTemplate<UT, "con">) => [InboundConMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetDisMessageParts<UT extends UserType> = (idm: InboundMessageTemplate<UT, "dis">) => [InboundDisMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetMesMessageParts<UT extends UserType> = (imm: InboundMessageTemplate<UT, "mes">) => [InboundMesMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetAckMessageParts<UT extends UserType> = (iam: InboundMessageTemplate<UT, "ack">) => [InboundAckMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetUserSpecifics<UT extends UserType> = (smmg: SendMesMessageCommon, hcm: HandleConMessage<UT>, hdm: HandleDisMessage<UT>, hmm: HandleMesMessage<UT>, ham: HandleAckMessage<UT>) => [() => string, SendMesMessage<UT>, GetConMessageParts<UT>, GetDisMessageParts<UT>, GetMesMessageParts<UT>, GetAckMessageParts<UT>]

const getHostSpecifics : GetUserSpecifics<"host"> = (smmg, hcm, hdm, hmm, ham) => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + "?host_token=" + localStorage.getItem("host_token")
    const sendMesMessage: SendMesMessage<"host"> = (number, body, guessesId) => {
        for (const guessId of guessesId) {
            smmg(number, getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: number, body: body, guessId: guessId}))
        }
    }
    const getConMessageParts: GetConMessageParts<"host"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }

    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }

    const getMesMessageParts: GetMesMessageParts<"host"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"host">>(imm, {prefix: 1, number: 2, guessId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }

    const getAckMessageParts: GetAckMessageParts<"host"> = (iam) => {
        const parts = getMessageParts<InboundAckMessage<"host">>(iam, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }

    return [getWsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = (smmg, hcm, hdm, hmm, ham) => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT as string
    const sendMesMessage: SendMesMessage<"guess"> = (number, body, guessesId) => {
        smmg(number, getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: number, body: body}))
    }
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number})
        return [parts, ack]
    }

    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number})
        return [parts, ack]
    }

    const getMesMessageParts: GetMesMessageParts<"guess"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"guess">>(imm, {prefix: 1, number: 2, body: 3})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number})
        return [parts, ack]
    }

    const getAckMessageParts: GetAckMessageParts<"guess"> = (iam) => {
        const parts =  getMessageParts<InboundAckMessage<"guess">>(iam, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: parts.prefix, number: parts.number})
        return [parts, ack]
    }

    return [getWsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts]
}
