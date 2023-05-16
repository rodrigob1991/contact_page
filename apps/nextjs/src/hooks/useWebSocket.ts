import {UserType} from "chat-common/src/model/types"
import {
    InboundConMessage,
    InboundConMessageParts,
    InboundDisMessage,
    InboundDisMessageParts,
    InboundMesMessage,
    InboundMesMessageParts,
    InboundMessageTemplate,
    InboundServerAckMessage,
    InboundServerAckMessageParts,
    InboundUserAckMessage,
    InboundUserAckMessageParts,
    OutboundAckMessage,
    OutboundFromGuessAckMessage,
    OutboundFromGuessMesMessage,
    OutboundFromHostAckMessage,
    OutboundFromHostMesMessage,
    OutboundMesMessage,
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"
import {paths} from "chat-common/src/model/constants"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleServerAckMessage =  (n: number) => void
export type HandleUserAckMessage = (n: number, ui: number) => void
export type IsMessageAckByServer = (n: number) => boolean
export type AddPendingUserAckMessage = (n: number, ui: number) => void

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
    handleUserAckMessage: HandleUserAckMessage
    isMessageAckByServer: IsMessageAckByServer
    addPendingUserAckMessage: AddPendingUserAckMessage
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
                                                              addPendingUserAckMessage,
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

    const [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getUserAckMessageParts] = (userType === "host" ? getHostSpecifics() : getGuessSpecifics()) as unknown as GetUserSpecificsReturn<UT>

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current
    const isConnected = () => {
        const ws = getWS()
        return ws && ws.readyState === ws.OPEN
    }
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
                    [parts, outboundAckMessage] = getConMessageParts(inboundMessage as InboundConMessage<UT>["template"])
                    handleConMessage(parts)
                    break
                case "dis":
                    [parts, outboundAckMessage] = getDisMessageParts(inboundMessage as InboundDisMessage<UT>["template"])
                    handleDisMessage(parts)
                    break
                case "mes":
                    [parts, outboundAckMessage] = getMesMessageParts(inboundMessage as InboundMesMessage<UT>["template"])
                    handleMesMessage(parts)
                    break
                case "sack":
                    parts = getServerAckMessageParts(inboundMessage as InboundServerAckMessage<UT>["template"])
                    handleServerAckMessage(parts.number)
                    break
                case "uack":
                    [parts, outboundAckMessage] = getUserAckMessageParts(inboundMessage as InboundUserAckMessage<UT>["template"])
                    handleUserAckMessage(parts.number, parts.userId)
                    break
                default:
                    throw new Error("invalid inbound message")
            }
            // acknowledge message if is not a server ack
            if (outboundAckMessage)
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

    const sendOutboundMesMessage: SendOutboundMesMessage = (number, body, usersIds) => {
        for (const userId of usersIds) {
            const resendUntilAck = () => {
                if (isConnected()) {
                    (getWS() as WebSocket).send(getOutboundMesMessage(number, userId, body))
                    setTimeout(() => {
                        if (!isMessageAckByServer(number)) {
                            resendUntilAck()
                        }
                    }, 5000)
                }
            }
            addPendingUserAckMessage(number, userId)
            resendUntilAck()
        }
    }
    return sendOutboundMesMessage
}

type GetOutboundMesMessage<UT extends UserType> = (number : number, userId: number, body: string) => OutboundMesMessage<UT>["template"]
type GetConMessageParts<UT extends UserType> = (icm: InboundConMessage<UT>["template"]) => [InboundConMessageParts<UT>, OutboundAckMessage<UT>["template"]]
type GetDisMessageParts<UT extends UserType> = (idm: InboundDisMessage<UT>["template"]) => [InboundDisMessageParts<UT>, OutboundAckMessage<UT>["template"]]
type GetMesMessageParts<UT extends UserType> = (imm: InboundMesMessage<UT>["template"]) => [InboundMesMessageParts<UT>, OutboundAckMessage<UT>["template"]]
type GetServerAckMessageParts<UT extends UserType> = (iam: InboundServerAckMessage<UT>["template"]) => InboundServerAckMessageParts<UT>
type GetUserAckMessageParts<UT extends UserType> = (iam: InboundUserAckMessage<UT>["template"]) => [InboundUserAckMessageParts<UT>, OutboundAckMessage<UT>["template"]]
type GetUserSpecificsReturn<UT extends UserType> = [() => string, GetOutboundMesMessage<UT>, GetConMessageParts<UT>, GetDisMessageParts<UT>, GetMesMessageParts<UT>, GetServerAckMessageParts<UT>, GetUserAckMessageParts<UT>]
type GetUserSpecifics<UT extends UserType> = () => GetUserSpecificsReturn<UT>

const getHostSpecifics : GetUserSpecifics<"host"> = () => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + paths.host
    const getOutboundMesMessage: GetOutboundMesMessage<"host"> = (number, guessId, body) => getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: number, body: body, userId: guessId})
    const getConMessageParts: GetConMessageParts<"host"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "uack", originPrefix: "dis", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"host"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"host">>(imm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "uack", originPrefix: "mes", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"host"> = (isam) =>
        getMessageParts<InboundServerAckMessage<"host">>(isam, {prefix: 1, number: 2, userId: 3})

    const getGuessAckMessageParts: GetUserAckMessageParts<"host"> = (iuam) => {
        const parts = getMessageParts<InboundUserAckMessage<"host">>(iuam, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromHostAckMessage>({prefix: "uack", originPrefix: "uack", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }

    return [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getGuessAckMessageParts]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const getWsEndpoint = () => process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT + paths.guess
    const getOutboundMesMessage: GetOutboundMesMessage<"guess"> = (number, hostId, body) => getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: number, userId: hostId, body: body})
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) => {
        const parts = getMessageParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) => {
        const parts = getMessageParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "uack", originPrefix: "dis", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"guess"> = (imm) => {
        const parts = getMessageParts<InboundMesMessage<"guess">>(imm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "uack", originPrefix: "mes", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"guess"> = (isam) =>
        getMessageParts<InboundServerAckMessage<"guess">>(isam, {prefix: 1, number: 2, userId: 3})

    const getHostAckMessageParts: GetUserAckMessageParts<"guess"> = (iuam) => {
        const parts =  getMessageParts<InboundUserAckMessage<"guess">>(iuam, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromGuessAckMessage>({prefix: "uack", originPrefix: "uack", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }

    return [getWsEndpoint, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getHostAckMessageParts]
}
