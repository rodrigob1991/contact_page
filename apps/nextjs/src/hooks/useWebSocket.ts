import {UserType} from "chat-common/src/model/types"
import {
    InboundConMessage,
    InboundConMessageParts,
    InboundDisMessageParts,
    InboundMesMessage,
    InboundMesMessageParts, InboundMessage,
    InboundMessageTemplate,
    InboundToGuessMessage,
    InboundToHostMessage, OutboundFromGuessMesMessage, OutboundFromHostMesMessage, OutboundFromUserAckMessage,
    OutboundFromUserMesMessage,
    OutboundMessageTemplate
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleAckMessage<UT extends UserType> =  (n: number) => void

type GuessId<UT extends UserType> = UT extends "host" ? number : undefined
export type SendMessage<UT extends UserType> = (number: number, body: string, guessId: GuessId<UT>) => void

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
    const [wsEndpoint, handleMessage, getOutboundMesMessage] = userType === "host" ?
        getHostSpecifics(handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)
        : getGuessSpecifics(handleConMessage, handleDisMessage, handleMesMessage, handleAckMessage)

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current as WebSocket

    useEffect(() => {
            const ws = new WebSocket(wsEndpoint)
            ws.onmessage = ({data: inboundMessage}) => {
                handleMessage(inboundMessage)
                const {prefix: originPrefix, number} = getMessageParts<InboundMessage>(inboundMessage, {prefix: 1, number: 2})
                ws.send(getMessage<OutboundFromUserAckMessage>({prefix: "ack", originPrefix: originPrefix, number: number}))
            }
            setWS(ws)
            return () => {
                ws.close()
            }
        }
        , [])

    const sendMesMessage: SendMessage<UT> = (number, body, guessId) => {
        getWS().send((getOutboundMesMessage as unknown as GetOutboundMessage<UT>)(number, body, guessId))
    }

    return sendMesMessage
}

type HandleInboundMessage<UT extends UserType> = (im: InboundMessageTemplate<UT>) => void
type GetOutboundMessage<UT extends UserType> = (n: number, b: string, gi: GuessId<UT>) => OutboundMessageTemplate<UT, "mes">
type GetUserSpecifics<UT extends UserType> = (hcm: HandleConMessage<UT>, hdm: HandleDisMessage<UT>, hmm: HandleMesMessage<UT>, ham: HandleAckMessage<UT>) => [string, HandleInboundMessage<UT>, GetOutboundMessage<UT>]

const getHostSpecifics : GetUserSpecifics<"host"> = (hcm, hdm, hmm, ham) => {
    const wsEndpoint = process.env.WEBSOCKET_ENDPOINT + "?host_user=" + process.env.PRIVATE_TOKEN
    const handleInboundMessage: HandleInboundMessage<"host"> = (im) => {
        const prefix = getMessagePrefix(im)
        switch (prefix) {
            case "con":
                handleConMessage(getMessageParts(im))
                break
            case "dis":
                handleDisMessage()
                break
            case "mes":
                handleMesMessage()
                break
            case "ack":
                handleAckMessage()
        }
    }
    const getOutboundMesMessage = (n: number, b: string, gi: number) => getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: n, body: b, guessId: gi})

    return [wsEndpoint, handleInboundMessage, getOutboundMesMessage]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = (hcm, hdm, hmm, ham) => {
    const wsEndpoint = process.env.WEBSOCKET_ENDPOINT as string
    const handleInboundMessage: HandleInboundMessage<"guess"> = (im) => {
        const prefix = getMessagePrefix(im)
        switch (prefix) {
            case "con":
                hcm(getMessageParts(im))
                break
            case "dis":
                handleDisMessage()
                break
            case "mes":
                handleMesMessage()
                break
            case "ack":
                handleAckMessage()
        }
    }
    const getOutboundMesMessage = (n: number, b: string, gi: undefined) => getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: n, body: b})

    return [wsEndpoint, handleInboundMessage, getOutboundMesMessage]
}
