import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {ContainerProps, Hide, SendOutboundMessage as SendOutboundMessageFromView} from "./View"
import useWebSocket, {
    ConnectionState,
    HandleConMessage,
    HandleDisMessage,
    HandleMesMessage,
    HandleNewConnectionState,
    HandleServerAckMessage,
    HandleUserAckMessage,
    IsMessageAckByServer,
} from "../../hooks/useWebSocket"
import {useEffect, useRef, useState} from "react"

export type InboundMessageData = { flow: "in", fromUserId: string, number: number, body: string }
export type OutboundMessageData = { flow: "out", fromUserId: string, number: number, body: string, toUsersIds: Map<number, boolean>, serverAck: boolean }
export type MessageData = InboundMessageData | OutboundMessageData

export type FirstHandleConMessage<UT extends UserType> = (cm: InboundConMessageParts<UT>) => string
export type FirstHandleDisMessage<UT extends UserType> = (dm: InboundDisMessageParts<UT>) => string
export type FirstHandleMesMessage<UT extends UserType> = (mm: InboundMesMessageParts<UT>) => string

type Props<UT extends UserType> = {
    userType: UT
    firstHandleConMessage: FirstHandleConMessage<UT>
    firstHandleDisMessage: FirstHandleDisMessage<UT>
    firstHandleMesMessage: FirstHandleMesMessage<UT>
    connect: boolean
    nextHandleNewConnectionState: HandleNewConnectionState
    viewProps: { containerProps: ContainerProps, hide?: Hide }
}

export const HOST_ID = 1
export const LOCAL_USER_ID = "me"

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          firstHandleConMessage,
                                                          firstHandleDisMessage,
                                                          firstHandleMesMessage,
                                                          connect,
                                                          nextHandleNewConnectionState,
                                                          viewProps
                                                      }: Props<UT>) {
    const [connectedUsersIds, setConnectedUsersIds] = useState<string[]>([])
    const setConnectedUserId = (id: string) => {
        setConnectedUsersIds((ids) => [...ids, id])
    }
    const removeConnectedUserId = (id: string) => {
        setConnectedUsersIds((ids) => {
            const updatedIds = [...ids]
            updatedIds.splice(ids.findIndex((currentId) => currentId === id), 1)
            return updatedIds
        })
    }

    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        setConnectionState(cs)
        switch (cs) {
            case ConnectionState.CONNECTED :
                setConnectedUserId(LOCAL_USER_ID)
                break
            case ConnectionState.DISCONNECTED :
                setConnectedUsersIds([])
        }
        nextHandleNewConnectionState(cs)
    }

    const [messagesData, setMessagesData] = useState<MessageData[]>([])
    const getOutboundMessageData = (n: number) => {
        const outboundMessageData = messagesData[n]
        if (outboundMessageData.flow !== "out") {
            throw new Error("message " + JSON.stringify(outboundMessageData) + " is not an outbound message")
        }
        return outboundMessageData as OutboundMessageData
    }
    const updateOutboundMessageData = <K extends keyof OutboundMessageData>(n: number, key: K, value: OutboundMessageData[K]) => {
        setMessagesData((messages) => {
            const updatedMessages = [...messages]
            const outboundMessage = updatedMessages[n]
            if (!(key in outboundMessage)) {
                throw new Error("key " + key + " does not belong to " + JSON.stringify(outboundMessage))
            }
            (outboundMessage as OutboundMessageData)[key] = value
            return updatedMessages
        })
    }
    const setInboundMessageData = (md: InboundMessageData) => {
        setMessagesData((messagesData) => [...messagesData, md])
    }
    const refToOutboundMessagesNumbersToSend = useRef<number[]>([])
    const getOutboundMessagesNumbersToSend = () => refToOutboundMessagesNumbersToSend.current

    const setNewOutboundMessageData = (body: string, toUsersIds: Map<number, boolean>) => {
        setMessagesData((messagesData) => {
            const number = messagesData.length
            getOutboundMessagesNumbersToSend().push(number)
            const messageData: OutboundMessageData = {flow: "out", fromUserId: LOCAL_USER_ID, toUsersIds: toUsersIds, number: messagesData.length, body: body, serverAck: false}
            return [...messagesData, messageData]
        })
    }
    useEffect(() => {
        getOutboundMessagesNumbersToSend().forEach((n) => {
            const {body, number, toUsersIds} = getOutboundMessageData(n)
            sendOutboundMesMessage(number, body, [...toUsersIds.keys()])
        })
        getOutboundMessagesNumbersToSend().splice(0, getOutboundMessagesNumbersToSend().length)
    }, [messagesData])

    const setMessageAsAcknowledgedByServer = (n: number) => {
        updateOutboundMessageData(n, "serverAck", true)
    }
    const setMessageAsAcknowledgedByUser = (n: number, ui: number) => {
        const outboundMessageData = messagesData[n]
        if ("toUsersIds" in outboundMessageData) {
            updateOutboundMessageData(n, "toUsersIds", outboundMessageData["toUsersIds"].set(ui, true))
        } else {
            console.error("should be always a outbound message")
        }
    }

    const isMessageAckByServer: IsMessageAckByServer = (n) => getOutboundMessageData(n).serverAck

    const handleConMessage: HandleConMessage<UT> = (cm) => {
        const userId = firstHandleConMessage(cm)
        setConnectedUserId(userId)
    }
    const handleDisMessage: HandleDisMessage<UT> = (dm) => {
        const userId = firstHandleDisMessage(dm)
        removeConnectedUserId(userId)
    }
    const handleMesMessage: HandleMesMessage<UT> = (mm) => {
        const userId = firstHandleMesMessage(mm)
        setInboundMessageData({flow: "in", fromUserId: userId, number: mm.number, body: mm.body})
    }
    const handleServerAckMessage: HandleServerAckMessage = (n) => {
        setMessageAsAcknowledgedByServer(n)
    }
    const handleUserAckMessage: HandleUserAckMessage<UT> = (n, ui) => {
        setMessageAsAcknowledgedByUser(n, ui)
    }

    const sendOutboundMesMessage = useWebSocket({
        userType: userType,
        handleConMessage: handleConMessage,
        handleDisMessage: handleDisMessage,
        handleMesMessage: handleMesMessage,
        handleServerAckMessage: handleServerAckMessage,
        handleUserAckMessage: handleUserAckMessage,
        isMessageAckByServer: isMessageAckByServer,
        connect: connect,
        handleNewConnectionState: handleNewConnectionState
    })

    const [sendOutboundMessageFromView] = (userType === "host" ? getHostSpecifics(setNewOutboundMessageData) : getGuessSpecifics(setNewOutboundMessageData)) as GetUserSpecificsReturn<UT>

    return <ChatView userType={userType} connectionState={connectionState} connectedUsersIds={connectedUsersIds} messages={messagesData} sendOutboundMessage={sendOutboundMessageFromView}  {...viewProps}/>
}

type GetUserSpecificsReturn<UT extends UserType> =  [SendOutboundMessageFromView<UT>]
type GetUserSpecifics<UT extends UserType> = (setNewOutboundMessageData: (b: string, to: Map<number, boolean>) => void) => GetUserSpecificsReturn<UT>

const getHostSpecifics: GetUserSpecifics<"host"> = (setNewOutboundMessageData) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"host"> = (body, toGuessesIds) => {
        setNewOutboundMessageData(body, new Map(toGuessesIds.map(ui => [parseInt(ui), false])))
    }
    return [sendOutboundMessageFromView]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = (setNewOutboundMessageData) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"guess"> = (body, toUsersIds) => {
        // toUsersIds will be undefined
        setNewOutboundMessageData(body, new Map([[HOST_ID, false]]))
    }
    return [sendOutboundMessageFromView]
}
