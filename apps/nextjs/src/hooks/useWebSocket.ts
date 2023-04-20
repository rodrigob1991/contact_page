import {UserType} from "chat-common/src/model/types"
import {
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
    OutboundFromUserMesMessage
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleServerAckMessage =  (n: number) => void
export type HandleUserAckMessage<UT extends UserType> = (n: number, ui: number) => void
export type IsMessageAckByServer = (n: number) => boolean

export type GuessesIds<UT extends UserType> = UT extends "host" ? number[] : undefined
export type GuessId<UT extends UserType> = UT extends "host" ? number : undefined
export type SendOutboundMesMessage = (number: number, body: string, usersIds: number[]) => void
export enum ConnectionState { CONNECTED, DISCONNECTED, CONNECTING}
export type HandleNewConnectionState = (cs: ConnectionState) => void

export type Props<UT extends UserType> = {
    userType: UT
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
    handleServerAckMessage: HandleServerAckMessage
    handleUserAckMessage: HandleUserAckMessage<UT>
    isMessageAckByServer: IsMessageAckByServer
    connect: boolean
    handleNewConnectionState: HandleNewConnectionState
}

export default function useWebSocket<UT extends UserType>({
                                                              userType,
                                                              handleConMessage,
                                                              handleDisMessage,
                                                              handleMesMessage,
                                                              handleServerAckMessage,
                                                              handleUserAckMessage,
                                                              isMessageAckByServer,
                                                              connect,
                                                              handleNewConnectionState,
                                                          }: Props<UT>) {
    const handleConnecting = () => {
        handleNewConnectionState(ConnectionState.CONNECTING)
    }
    const handleConnected = () => {
        handleNewConnectionState(ConnectionState.CONNECTED)
    }
    const handleDisconnected = () => {
        handleNewConnectionState(ConnectionState.DISCONNECTED)
    }

    const [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getUserAckMessageParts] = userType === "host" ? getHostSpecifics() : getGuessSpecifics()

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current
    const initWS = () => {
        handleConnecting()
        const ws = new WebSocket(getWsEndpoint())
        ws.onopen = (e) => {
            handleConnected()
        }
        ws.onclose = (e) => {
            handleDisconnected()
        }
        ws.onerror = (e) => {
            if (ws.readyState === ws.CONNECTING)
                handleConnecting()
        }
        ws.onmessage = ({data: inboundMessage}: MessageEvent<InboundMessageTemplate<UT>>) => {
            console.log("inbound message: " + inboundMessage)
            let parts
            let outboundAckMessage
            const prefix = getMessagePrefix(inboundMessage)
            switch (prefix) {
                case "con":
                    [parts, outboundAckMessage] = getConMessageParts(inboundMessage as InboundMessageTemplate<UT, "con">)
                    handleConMessage(parts)
                    break
                case "dis":
                    [parts, outboundAckMessage] = getDisMessageParts(inboundMessage as InboundMessageTemplate<UT, "dis">)
                    handleDisMessage(parts)
                    break
                case "mes":
                    [parts, outboundAckMessage] = getMesMessageParts(inboundMessage as InboundMessageTemplate<UT, "mes">)
                    handleMesMessage(parts)
                    break
                case "sack":
                    [parts, outboundAckMessage] = getServerAckMessageParts(inboundMessage as InboundMessageTemplate<UT, "sack">)
                    handleServerAckMessage(parts.number)
                    break
                case "uack":
                    [parts, outboundAckMessage] = getUserAckMessageParts(inboundMessage as InboundMessageTemplate<UT, "uack">)
                    handleUserAckMessage(parts.number, parts.guessId)
                    break
                default:
                    throw new Error("invalid inbound message")
            }
            // acknowledged message
            ws.send(outboundAckMessage)
        }
        setWS(ws)
    }
    const closeWS = () => {
        getWS()?.close()
    }

    useEffect(() => {
            if (connect) {
                initWS()
            } else {
                closeWS()
            }
            return closeWS
        }
        , [connect])

    /*const ackMessagesRef = useRef<boolean[]>([])
    const getAckMessages = () => ackMessagesRef.current
    const setMessageToAck = (n: number) => { getAckMessages()[n] = false }
    const setMessageAlreadyAck = (n: number) => { getAckMessages()[n] = true }
    const isMessageAck = (n: number) => getAckMessages()[n]*/

    const sendOutboundMesMessage: SendOutboundMesMessage = (number, body, usersIds) => {
        for (const userId of usersIds) {
            if (getWS()) {
                const resendUntilAck = () => {
                    (getWS() as WebSocket).send(getOutboundMesMessage(number, userId, body))
                    setTimeout(() => {
                        if (!isMessageAckByServer(number)) {
                            resendUntilAck()
                        }
                    }, 5000)
                }
                //setMessageToAck(number)
                resendUntilAck()
            }
        }
    }
    return sendOutboundMesMessage
}

type GetOutboundMesMessage<UT extends UserType> = (number : number, guessId: number, body: string) => OutboundFromUserMesMessage<UT>["template"]
type GetConMessageParts<UT extends UserType> = (icm: InboundMessageTemplate<UT, "con">) => [InboundConMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetDisMessageParts<UT extends UserType> = (idm: InboundMessageTemplate<UT, "dis">) => [InboundDisMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetMesMessageParts<UT extends UserType> = (imm: InboundMessageTemplate<UT, "mes">) => [InboundMesMessageParts<UT>, OutboundFromUserAckMessage<UT>["template"]]
type GetServerAckMessageParts<UT extends UserType> = (iam: InboundMessageTemplate<UT, "sack">) => [InboundServerAckMessageParts<UT>, OutboundFromUserServerAckMessage<UT>["template"]]
type GetUserAckMessageParts<UT extends UserType> = (iam: InboundMessageTemplate<UT, "uack">) => [InboundUserAckMessageParts<UT>, OutboundFromUserUserAckMessage<UT>["template"]]
type GetUserSpecifics<UT extends UserType> = () => [() => string, GetOutboundMesMessage<UT>, GetConMessageParts<UT>, GetDisMessageParts<UT>, GetMesMessageParts<UT>, GetServerAckMessageParts<UT>, GetUserAckMessageParts<UT>]

const getHostSpecifics : GetUserSpecifics<"host"> = () => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + "?host_token=" + localStorage.getItem("host_token")
    const getOutboundMesMessage: GetOutboundMesMessage<"host"> = (number, guessId, body) => getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: number, body: body, guessId: guessId})
    const getConMessageParts: GetConMessageParts<"host"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: "con", number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: "dis", number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"host"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"host">>(imm, {prefix: 1, number: 2, guessId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "ack", originPrefix: "mes", number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"host"> = (isam) => {
        const parts = getMessageParts<InboundServerAckMessage<"host">>(isam, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromHostServerAckMessage>({prefix: "ack", originPrefix: "sack", number: parts.number})
        return [parts, ack]
    }
    const getUserAckMessageParts: GetUserAckMessageParts<"host"> = (iuam) => {
        const parts = getMessageParts<InboundUserAckMessage<"host">>(iuam, {prefix: 1, number: 2, guessId: 3})
        const ack = getMessage<OutboundFromHostUserAckMessage>({prefix: "ack", originPrefix: "uack", number: parts.number, guessId: parts.guessId})
        return [parts, ack]
    }

    return [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getUserAckMessageParts]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT as string
    const getOutboundMesMessage: GetOutboundMesMessage<"guess"> = (number, guessId, body) => getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: number, body: body})
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: "con", number: parts.number})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: "dis", number: parts.number})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"guess"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"guess">>(imm, {prefix: 1, number: 2, body: 3})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "ack", originPrefix: "mes", number: parts.number})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"guess"> = (isam) => {
        const parts = getMessageParts<InboundServerAckMessage<"guess">>(isam, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessServerAckMessage>({prefix: "ack", originPrefix: "sack", number: parts.number})
        return [parts, ack]
    }
    const getHostAckMessageParts: GetUserAckMessageParts<"guess"> = (iuam) => {
        const parts =  getMessageParts<InboundUserAckMessage<"guess">>(iuam, {prefix: 1, number: 2})
        const ack = getMessage<OutboundFromGuessHostAckMessage>({prefix: "ack", originPrefix: "uack", number: parts.number})
        return [parts, ack]
    }

    return [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getHostAckMessageParts]
}
