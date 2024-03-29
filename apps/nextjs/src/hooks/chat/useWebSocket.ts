import {UserType} from "chat-common/src/model/types"
import {
    InboundConMessage,
    InboundConMessageParts,
    InboundDisMessage,
    InboundDisMessageParts,
    InboundMesMessage,
    InboundMesMessageParts,
    InboundMessageParts,
    InboundMessageTemplate,
    InboundServerAckMessage,
    InboundServerAckMessageParts,
    InboundToGuessHostsMessage,
    InboundToHostGuessesMessage,
    InboundUserAckMessage,
    InboundUserAckMessageParts,
    InboundUsersMessage,
    InboundUsersMessageParts,
    OutboundAckMessage,
    OutboundFromGuessAckMessage,
    OutboundFromGuessMesMessage,
    OutboundFromHostAckMessage,
    OutboundFromHostMesMessage,
    OutboundMesMessage,
} from "../../types/chat"
import {useEffect, useRef} from "react"
import {getMessage, getParts, getPrefix} from "chat-common/src/message/functions"
import {paths} from "chat-common/src/model/constants"
import {IsMessageAckByServer} from "./useMessages"

export type HandleUsersMessage<UT extends UserType> =  (cm: InboundUsersMessageParts<UT>) => void
export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleServerAckMessage =  (n: number) => void
export type HandleUserAckMessage = (n: number, ui: number) => void

export type SendMesMessage = (number: number, body: string, usersIds: number[]) => void
export type HandleConnecting = () => void
export type HandleConnected = () => void
export type HandleDisconnected = () => void

export type Props<UT extends UserType> = {
    userType: UT
    handleUsersMessage: HandleUsersMessage<UT>
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
    handleServerAckMessage: HandleServerAckMessage
    handleUserAckMessage: HandleUserAckMessage
    isMessageAckByServer: IsMessageAckByServer
    // addPendingUserAckMessage: AddPendingUserAckMessage
    connect: boolean
    handleConnecting: HandleConnecting
    handleConnected: HandleConnected
    handleDisconnected: HandleDisconnected
}

export default function useWebSocket<UT extends UserType>({
                                                              userType,
                                                              handleUsersMessage,
                                                              handleConMessage,
                                                              handleDisMessage,
                                                              handleMesMessage,
                                                              handleServerAckMessage,
                                                              handleUserAckMessage,
                                                              isMessageAckByServer,
                                                              // addPendingUserAckMessage,
                                                              connect,
                                                              handleConnecting, 
                                                              handleConnected, 
                                                              handleDisconnected
                                                          }: Props<UT>) {
    const [path, getOutboundMesMessage, getUsersMessageParts, getConMessageParts, getDisMessageParts, getMesMessageParts, getServerAckMessageParts, getUserAckMessageParts] = (userType === "host" ? getHostSpecifics() : getGuessSpecifics()) as GetUserSpecificsReturn<UT>

    const refToWs = useRef<WebSocket>()
    const setWS = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWS = () => refToWs.current

    useEffect(() => {
        if (connect) {
            handleConnecting()
            initWS()
        }
        return () => {
            closeWS()
            handleDisconnected()
        }
    }
    , [connect])

    type InboundMessagePartsToFormId<IMP extends InboundMessageParts> = Pick<IMP, "prefix" | "number" | ("userId" extends keyof IMP ? "userId" : never)>
    const refToInboundMessagesIdsSet = useRef(new Set<string>())
    const getInboundMessagesIdsSet = () => refToInboundMessagesIdsSet.current
    const getInboundMessageId = <IMP extends InboundMessageParts>(parts: InboundMessagePartsToFormId<IMP>) => parts.prefix + ":" + parts.number + ("userId" in parts ? ":" + parts.userId : "")
    const setMessageAsReceived = <IMP extends InboundMessageParts>(parts: InboundMessagePartsToFormId<IMP>) => {
        getInboundMessagesIdsSet().add(getInboundMessageId(parts))
    }
    const wasMessageNotReceived = <IMP extends InboundMessageParts>(parts: InboundMessagePartsToFormId<IMP>) => !getInboundMessagesIdsSet().has(getInboundMessageId(parts))

    const isConnected = () => {
        const ws = getWS()
        return ws && ws.readyState === ws.OPEN
    }

    function handleOnOpen(this: WebSocket, e: Event) {
        handleConnected()
    }
    function handleOnError(this: WebSocket, e: Event) {
    }
    function handleOnClose(this: WebSocket, e: CloseEvent) {
        if (e.code !== userCloseCode) {
          handleConnecting()
          setTimeoutIdForReconnect("close", window.setTimeout(() => {
                   initWS()
        }, 1000))
        } else {
          handleDisconnected()
        }
    }
    const timeoutIdForReconnect = useRef({init: 0, close: 0})
    const getTimeoutIdForReconnect = (on: "init" | "close") => timeoutIdForReconnect.current[on]
    const setTimeoutIdForReconnect = (on: "init" | "close", id: number) => {
        timeoutIdForReconnect.current[on] = id
    }

    function handleOnMessage(this: WebSocket, {data: inboundMessage}: MessageEvent<InboundMessageTemplate>) {
        console.log("inbound message: " + inboundMessage)
        const ackMessage = (outboundAckMessage: OutboundAckMessage<UT>["template"]) => {
            this.send(outboundAckMessage)
        }

        const prefix = getPrefix(inboundMessage)
        switch (prefix) {
            case "usrs": {
                const [parts, outboundAckMessage] = getUsersMessageParts(inboundMessage as InboundUsersMessage<UT>["template"])
                if (wasMessageNotReceived(parts)) {
                    handleUsersMessage(parts)
                    setMessageAsReceived(parts)
                }
                ackMessage(outboundAckMessage)
                break
            }
            case "con":
                const [conParts, outboundConAckMessage] = getConMessageParts(inboundMessage as InboundConMessage<UT>["template"])
                if (wasMessageNotReceived(conParts)) {
                    handleConMessage(conParts)
                    setMessageAsReceived(conParts)
                }
                ackMessage(outboundConAckMessage)
                break
            case "dis":
                const [disParts, outboundDisAckMessage] = getDisMessageParts(inboundMessage as InboundDisMessage<UT>["template"])
                if (wasMessageNotReceived(disParts)) {
                    handleDisMessage(disParts)
                    setMessageAsReceived(disParts)
                }
                ackMessage(outboundDisAckMessage)
                break
            case "mes":
                const [mesParts, outboundMesAckMessage] = getMesMessageParts(inboundMessage as InboundMesMessage<UT>["template"])
                if (wasMessageNotReceived(mesParts)) {
                    handleMesMessage(mesParts)
                    setMessageAsReceived(mesParts)
                }
                ackMessage(outboundMesAckMessage)
                break
            case "uack":
                const [uackParts, outboundUAckAckMessage] = getUserAckMessageParts(inboundMessage as InboundUserAckMessage<UT>["template"])
                if (wasMessageNotReceived(uackParts)) {
                    handleUserAckMessage(uackParts.number, uackParts.userId)
                    setMessageAsReceived(uackParts)
                }
                ackMessage(outboundUAckAckMessage)
                break
            case "sack":
                const sackParts = getServerAckMessageParts(inboundMessage as InboundServerAckMessage<UT>["template"])
                if (wasMessageNotReceived(sackParts)) {
                    handleServerAckMessage(sackParts.number)
                    setMessageAsReceived(sackParts)
                }
                break
            default:
                throw new Error("invalid inbound message")
        }
    }

    const initWS = () => {
        const endpoint = process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT
        if (endpoint) {
            const ws = new WebSocket(endpoint + path)
            ws.onopen = handleOnOpen
            ws.onclose = handleOnClose
            ws.onerror = handleOnError
            ws.onmessage = handleOnMessage
            setWS(ws)

          /*  setTimeoutIdForReconnect("init", window.setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                   ws.close()
                }
            }, 1000)) */
        }
    }
    const userCloseCode = 3001
    const closeWS = () => {
        //clearTimeout(getTimeoutIdForReconnect("init"))
        clearTimeout(getTimeoutIdForReconnect("close"))
        getWS()?.close(userCloseCode)
    }

    const sendMesMessage: SendMesMessage = (number, body, usersIds) => {
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
            resendUntilAck()
        }
    }
    return sendMesMessage
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
        const ack = getMessage<OutboundFromHostAckMessage<"usrs">>({prefix: "uack", originPrefix: "usrs", number: parts.number})
        return [parts, ack]
    }
    const getConMessageParts: GetConMessageParts<"host"> = (icm) => {
        const parts = getParts<InboundConMessage<"host">>(icm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromHostAckMessage<"con">>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"host"> = (idm) => {
        const parts = getParts<InboundDisMessage<"host">>(idm, {prefix: 1, number: 2, userId: 3, body: 4})
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
        const ack = getMessage<OutboundFromGuessAckMessage<"usrs">>({prefix: "uack", originPrefix: "usrs", number: parts.number})
        return [parts, ack]
    }
    const getConMessageParts: GetConMessageParts<"guess"> = (icm) => {
        const parts = getParts<InboundConMessage<"guess">>(icm, {prefix: 1, number: 2, userId: 3, body: 4})
        const ack = getMessage<OutboundFromGuessAckMessage<"con">>({prefix: "uack", originPrefix: "con", number: parts.number, userId: parts.userId})
        return [parts, ack]
    }
    const getDisMessageParts: GetDisMessageParts<"guess"> = (idm) => {
        const parts = getParts<InboundDisMessage<"guess">>(idm, {prefix: 1, number: 2, userId: 3, body: 4})
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
