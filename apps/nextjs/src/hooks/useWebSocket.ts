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
    InboundServerAckMessageParts, InboundToGuessHostsMessage, InboundToHostGuessesMessage,
    InboundUserAckMessage,
    InboundUserAckMessageParts, InboundUsersMessage, InboundUsersMessageParts,
    MessagePrefix,
    OutboundAckMessage,
    OutboundFromGuessAckMessage,
    OutboundFromGuessMesMessage,
    OutboundFromHostAckMessage,
    OutboundFromHostMesMessage,
    OutboundMesMessage,
} from "../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getParts, getPrefix} from "chat-common/src/message/functions"
import {paths} from "chat-common/src/model/constants"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleServerAckMessage =  (n: number) => void
export type HandleUserAckMessage = (n: number, ui: number) => void
export type IsMessageAckByServer = (n: number) => boolean
export type AddPendingUserAckMessage = (n: number, ui: number) => void

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
    const [path, getOutboundMesMessage, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getUserAckMessageParts] = (userType === "host" ? getHostSpecifics() : getGuessSpecifics()) as GetUserSpecificsReturn<UT>

    const handleConnecting = () => {
        handleNewConnectionState(ConnectionState.CONNECTING)
    }
    const handleConnected = () => {
        handleNewConnectionState(ConnectionState.CONNECTED)
    }
    const handleDisconnected = () => {
        handleNewConnectionState(ConnectionState.DISCONNECTED)
    }

    type InboundMessagePartsToFormId = { prefix: MessagePrefix<"in">, number: number, userId: number }
    const refToInboundConDisMessagesIdsSet = useRef(new Set<string>())
    const refToInboundMesUackMessagesIdsSet = useRef(new Set<string>())
    const getInboundMessagesIdsSet = (prefix: MessagePrefix<"in">) => (prefix === "con" || prefix ===  "dis") ? refToInboundConDisMessagesIdsSet.current : refToInboundMesUackMessagesIdsSet.current
    const getInboundMessageId = ({prefix, number, userId}: InboundMessagePartsToFormId) => prefix + ":" + number + ":" + userId
    const setMessageAsReceived = (parts: InboundMessagePartsToFormId) => {
        getInboundMessagesIdsSet(parts.prefix).add(getInboundMessageId(parts))
    }
    const messageWasNotReceived = (parts: InboundMessagePartsToFormId) => !getInboundMessagesIdsSet(parts.prefix).has(getInboundMessageId(parts))

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
        const endpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT
        if (endpoint) {
            handleConnecting()
            const ws = new WebSocket(endpoint + path)
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
                const ackMessage = (outboundAckMessage: string) => {
                    ws.send(outboundAckMessage)
                }

                const prefix = getPrefix(inboundMessage)
                switch (prefix) {
                    case "con":
                        const [conParts, outboundConAckMessage] = getConMessageParts(inboundMessage as InboundConMessage<UT>["template"])
                        if (messageWasNotReceived(conParts)) {
                            handleConMessage(conParts)
                            setMessageAsReceived(conParts)
                        }
                        ackMessage(outboundConAckMessage)
                        break
                    case "dis":
                        const [disParts, outboundDisAckMessage] = getDisMessageParts(inboundMessage as InboundDisMessage<UT>["template"])
                        if (messageWasNotReceived(disParts)) {
                            handleDisMessage(disParts)
                            setMessageAsReceived(disParts)
                        }
                        ackMessage(outboundDisAckMessage)
                        break
                    case "mes":
                        const [mesParts, outboundMesAckMessage] = getMesMessageParts(inboundMessage as InboundMesMessage<UT>["template"])
                        if (messageWasNotReceived(mesParts)) {
                            handleMesMessage(mesParts)
                            setMessageAsReceived(mesParts)
                        }
                        ackMessage(outboundMesAckMessage)
                        break
                    case "uack":
                        const [uackParts, outboundUAckAckMessage] = getUserAckMessageParts(inboundMessage as InboundUserAckMessage<UT>["template"])
                        if (messageWasNotReceived(uackParts)) {
                            handleUserAckMessage(uackParts.number, uackParts.userId)
                            setMessageAsReceived(uackParts)
                        }
                        ackMessage(outboundUAckAckMessage)
                        break
                    case "sack":
                        const sackParts = getServerAckMessageParts(inboundMessage as InboundServerAckMessage<UT>["template"])
                        if (messageWasNotReceived(sackParts)) {
                            handleServerAckMessage(sackParts.number)
                            setMessageAsReceived(sackParts)
                        }
                        break
                    default:
                        throw new Error("invalid inbound message")
                }
            }
            setWS(ws)
        }
    }
    const closeWS = () => {
        getWS()?.close()
        getInboundMessagesIdsSet("con").clear()
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
type GetUsersMessageParts<UT extends UserType> = (ium: InboundUsersMessage<UT>["template"]) => [InboundUsersMessageParts<UT>, OutboundAckMessage<UT, "usrs">["template"]]
type GetConMessageParts<UT extends UserType> = (icm: InboundConMessage<UT>["template"]) => [InboundConMessageParts<UT>, OutboundAckMessage<UT, "con">["template"]]
type GetDisMessageParts<UT extends UserType> = (idm: InboundDisMessage<UT>["template"]) => [InboundDisMessageParts<UT>, OutboundAckMessage<UT, "dis">["template"]]
type GetMesMessageParts<UT extends UserType> = (imm: InboundMesMessage<UT>["template"]) => [InboundMesMessageParts<UT>, OutboundAckMessage<UT, "mes">["template"]]
type GetServerAckMessageParts<UT extends UserType> = (iam: InboundServerAckMessage<UT>["template"]) => InboundServerAckMessageParts<UT>
type GetUserAckMessageParts<UT extends UserType> = (iam: InboundUserAckMessage<UT>["template"]) => [InboundUserAckMessageParts<UT>, OutboundAckMessage<UT>["template"]]
type GetUserSpecificsReturn<UT extends UserType> = [string, GetOutboundMesMessage<UT>, GetUsersMessageParts<UT>, GetConMessageParts<UT>, GetDisMessageParts<UT>, GetMesMessageParts<UT>, GetServerAckMessageParts<UT>, GetUserAckMessageParts<UT>]
type GetUserSpecifics<UT extends UserType> = () => GetUserSpecificsReturn<UT>

const getHostSpecifics : GetUserSpecifics<"host"> = () => {
    const path = paths.host
    const getOutboundMesMessage: GetOutboundMesMessage<"host"> = (number, guessId, body) => getMessage<OutboundFromHostMesMessage>({prefix: "mes", number: number, body: body, userId: guessId})
    const getGuessesMessageParts: GetUsersMessageParts<"host"> = (ucm) => {
        const parts = getParts<InboundToHostGuessesMessage>(ucm, {prefix: 1, number: 2, body: 3})
        const ack = getMessage<OutboundFromHostAckMessage<"usrs">>({prefix: "uack", originPrefix: "con", number: parts.number})
        return [parts, ack]
    }
    const getConMessageParts: GetConMessageParts<"host"> = (icm) => {
        const parts = getParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage<"con">>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) => {
        const parts = getParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromHostAckMessage<"dis">>({prefix: "uack", originPrefix: "dis", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"host"> = (imm) => {
        const parts = getParts<InboundMesMessage<"host">>(imm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage<"mes">>({prefix: "uack", originPrefix: "mes", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"host"> = (isam) =>
        getParts<InboundServerAckMessage<"host">>(isam, {prefix: 1, number: 2, userId: 3})

    const getGuessAckMessageParts: GetUserAckMessageParts<"host"> = (iuam) => {
        const parts = getParts<InboundUserAckMessage<"host">>(iuam, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromHostAckMessage<"uack">>({prefix: "uack", originPrefix: "uack", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }

    return [path, getOutboundMesMessage, getGuessesMessageParts, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getGuessAckMessageParts]
}

const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const path = paths.guess
    const getOutboundMesMessage: GetOutboundMesMessage<"guess"> = (number, hostId, body) => getMessage<OutboundFromGuessMesMessage>({prefix: "mes", number: number, userId: hostId, body: body})
    const getHostsMessageParts: GetUsersMessageParts<"guess"> = (ucm) => {
        const parts = getParts<InboundToGuessHostsMessage>(ucm, {prefix: 1, number: 2, body: 3})
        const ack = getMessage<OutboundFromGuessAckMessage<"usrs">>({prefix: "uack", originPrefix: "con", number: parts.number})
        return [parts, ack]
    }
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) => {
        const parts = getParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromGuessAckMessage<"con">>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) => {
        const parts = getParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromGuessAckMessage<"dis">>({prefix: "uack", originPrefix: "dis", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getMesMessageParts: GetMesMessageParts<"guess"> = (imm) => {
        const parts = getParts<InboundMesMessage<"guess">>(imm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromGuessAckMessage<"mes">>({prefix: "uack", originPrefix: "mes", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getServerAckMessageParts: GetServerAckMessageParts<"guess"> = (isam) =>
        getParts<InboundServerAckMessage<"guess">>(isam, {prefix: 1, number: 2, userId: 3})

    const getHostAckMessageParts: GetUserAckMessageParts<"guess"> = (iuam) => {
        const parts =  getParts<InboundUserAckMessage<"guess">>(iuam, {prefix: 1, number: 2, userId: 3})
        const ack = getMessage<OutboundFromGuessAckMessage<"uack">>({prefix: "uack", originPrefix: "uack", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }

    return [path, getOutboundMesMessage, getHostsMessageParts, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getHostAckMessageParts]
}
