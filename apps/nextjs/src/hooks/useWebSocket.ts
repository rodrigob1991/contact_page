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
    InboundMessage,
    InboundMessageTemplate,
    OutboundFromGuessMesMessage,
    OutboundFromHostMesMessage,
    OutboundFromUserAckMessage,
    OutboundFromUserMessage
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getMessageParts} from "chat-common/src/message/functions"

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
            getWS().send(mesMessage)
            setTimeout(() => {
                if (!isMessageAck(number)) {
                    resendUntilAck()
                }
            }, 5000)
        }
        setMessageToAck(number)
        resendUntilAck()
    }

    const [wsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts] = userType === "host" ?
        getHostSpecifics(sendMesMessageCommon, handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)
        : getGuessSpecifics(sendMesMessageCommon, handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current as WebSocket

    useEffect(() => {
            const ws = new WebSocket(wsEndpoint)
            ws.onmessage = ({data: inboundMessage}: MessageEvent<InboundMessageTemplate<UT>>) => {
                const {prefix, number} = getMessageParts<InboundMessage>(inboundMessage, {prefix: 1, number: 2})
                switch (prefix) {
                    case "con":
                        handleConMessage(getConMessageParts(inboundMessage as InboundMessageTemplate<UT, "con">))
                        break
                    case "dis":
                        handleDisMessage(getDisMessageParts(inboundMessage as InboundMessageTemplate<UT, "dis">))
                        break
                    case "mes":
                        handleMesMessage(getMesMessageParts(inboundMessage as InboundMessageTemplate<UT, "mes">))
                        break
                    case "ack":
                        setMessageAlreadyAck(number)
                        handleAckMessage(number)
                }
                // acknowledged message
                ws.send(getMessage<OutboundFromUserAckMessage>({prefix: "ack", originPrefix: prefix, number: number}))
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
type GetConMessageParts<UT extends UserType> = (icm: InboundMessageTemplate<UT, "con">) => InboundConMessageParts<UT>
type GetDisMessageParts<UT extends UserType> = (idm: InboundMessageTemplate<UT, "dis">) => InboundDisMessageParts<UT>
type GetMesMessageParts<UT extends UserType> = (imm: InboundMessageTemplate<UT, "mes">) => InboundMesMessageParts<UT>
type GetAckMessageParts<UT extends UserType> = (iam: InboundMessageTemplate<UT, "ack">) => InboundAckMessageParts<UT>
type GetUserSpecifics<UT extends UserType> = (smmg: SendMesMessageCommon, hcm: HandleConMessage<UT>, hdm: HandleDisMessage<UT>, hmm: HandleMesMessage<UT>, ham: HandleAckMessage<UT>) => [string, SendMesMessage<UT>, GetConMessageParts<UT>, GetDisMessageParts<UT>, GetMesMessageParts<UT>, GetAckMessageParts<UT>]

const getHostSpecifics : GetUserSpecifics<"host"> = (smmg, hcm, hdm, hmm, ham) => {
    const wsEndpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + "?host_user=" + process.env.PRIVATE_TOKEN
    const sendMesMessage: SendMesMessage<"host"> = (number, body, guessesId) => {
        for (const guessId of guessesId) {
            smmg(number, getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: number, body: body, guessId: guessId}))
        }
    }
    const getConMessageParts: GetConMessageParts<"host"> = (icm) =>
        getMessageParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, guessId: 3})

    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) =>
        getMessageParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, guessId: 3})

    const getMesMessageParts: GetMesMessageParts<"host"> = (imm) =>
        getMessageParts<InboundMesMessage<"host">>(imm, {prefix: 1, number: 2, guessId: 3, body: 4})

    const getAckMessageParts: GetAckMessageParts<"host"> = (iam) =>
        getMessageParts<InboundAckMessage<"host">>(iam, {prefix: 1, number: 2, guessId: 3})

    return [wsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = (smmg, hcm, hdm, hmm, ham) => {
    const wsEndpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT as string
    const sendMesMessage: SendMesMessage<"guess"> = (number, body, guessesId) => {
        smmg(number, getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: number, body: body}))
    }
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) =>
        getMessageParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2})

    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) =>
        getMessageParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2})

    const getMesMessageParts: GetMesMessageParts<"guess"> = (imm) =>
        getMessageParts<InboundMesMessage<"guess">>(imm, {prefix: 1, number: 2, body: 3})

    const getAckMessageParts: GetAckMessageParts<"guess"> = (iam) =>
        getMessageParts<InboundAckMessage<"guess">>(iam, {prefix: 1, number: 2})

    return [wsEndpoint, sendMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getAckMessageParts]
}
