import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {ContainerProps, Hide, SendOutboundMessage as SendOutboundMessageFromView} from "./View"
import useWebSocket, {
    AddPendingToUserAckMessage,
    ConnectionState,
    GuessId,
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
const userAckStates = {pen: "pen", ack: "ack", nack: "nack"} as const
type UserAckState = typeof userAckStates[keyof typeof userAckStates]
type ToUsersId = Map<number, UserAckState>
export type OutboundMessageData = { flow: "out", fromUserId: string, number: number, body: string, toUsersIds: ToUsersId, serverAck: boolean }
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
                setAllMessagesAsNack()
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

    const setNewOutboundMessageData: SetNewOutboundMessageData = (body, toUsersIds) => {
        setMessagesData((messagesData) => {
            const number = messagesData.length
            getOutboundMessagesNumbersToSend().push(number)
            const messageData: OutboundMessageData = {flow: "out", fromUserId: LOCAL_USER_ID, toUsersIds: new Map(toUsersIds.map(ui => [ui, "pen"])), number: number, body: body, serverAck: false}
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

    const setMessageAsAcknowledgedByServer = (number: number) => {
        updateOutboundMessageData(number, "serverAck", true)
    }
    const isMessageAckByServer: IsMessageAckByServer = (n) => getOutboundMessageData(n).serverAck

    const setMessageAsAcknowledgedByUser = (number: number, userId: number) => {
        removePendingToUserAckMessage(number, userId)
        setMessagesData((messagesData) => {
            const updatedMessages = [...messagesData]
            const outboundMessage = updatedMessages[number] as OutboundMessageData
            if (!("toUsersIds" in outboundMessage)) {
                throw new Error("key toUsersIds is not in " + JSON.stringify(outboundMessage))
            }
            outboundMessage["toUsersIds"].set(userId, "ack")

            return updatedMessages
        })
    }
    const usersPendingToAckMessagesRef = useRef(new Map<number, number[]>)
    const getUsersPendingToAckMessages = () => usersPendingToAckMessagesRef.current
    const addPendingToUserAckMessage : AddPendingToUserAckMessage = (number, userId) => {
        let pendingMessages = getUsersPendingToAckMessages().get(userId)
        if (!pendingMessages)
            pendingMessages = []
        pendingMessages.push(number)
    }
    const removePendingToUserAckMessage = (number: number, userId: number) => {
        let pendingMessages = getUsersPendingToAckMessages().get(userId)
        if (pendingMessages) {
            const index = pendingMessages.findIndex(n => n === number)
            if (index >= 0)
                pendingMessages.splice(index, 1)
            if (pendingMessages.length === 0) {
                getUsersPendingToAckMessages().delete(userId)
            }
        }
    }
    // IF NOT USER ID MARK ALL USERS PENDING TO ACK MESSAGES AS NACK
    const setMessagesAsNack = (indexesByUserId: [[number, number[]]]) => {
        setMessagesData((messagesData) => {
            const updatedMessagesData = [...messagesData]
            for (const [userId, indexes] of indexesByUserId) {
                for (const index of indexes) {
                    const messageData = updatedMessagesData[index] as OutboundMessageData
                    if (messageData.toUsersIds.get(userId) === "pen") {
                        messageData.toUsersIds.set(userId, "nack")
                    }
                }
            }
            return updatedMessagesData
        })
    }
    const setAllMessagesAsNack = () => {
        if (getUsersPendingToAckMessages().size > 0) {
            setMessagesAsNack([...getUsersPendingToAckMessages().entries()] as [[number, number[]]])
        }
    }
    const setUserMessagesAsNack = (userId: number) => {
        const pendingToAckMessages = getUsersPendingToAckMessages().get(userId)
        if (pendingToAckMessages) {
            setMessagesAsNack([[userId, pendingToAckMessages]])
        }
    }

    const handleConMessage: HandleConMessage<UT> = (cm) => {
        const userId = firstHandleConMessage(cm)
        setConnectedUserId(userId)
    }
    const handleDisMessage: HandleDisMessage<UT> = (dm) => {
        const userId = firstHandleDisMessage(dm)
        setUserMessagesAsNack(getExternalUserId(userId))
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
        setMessageAsAcknowledgedByUser(n, getExternalUserId(ui))
    }

    const sendOutboundMesMessage = useWebSocket({
        userType: userType,
        handleConMessage: handleConMessage,
        handleDisMessage: handleDisMessage,
        handleMesMessage: handleMesMessage,
        handleServerAckMessage: handleServerAckMessage,
        handleUserAckMessage: handleUserAckMessage,
        isMessageAckByServer: isMessageAckByServer,
        addPendingToUserAckMessage: addPendingToUserAckMessage,
        connect: connect,
        handleNewConnectionState: handleNewConnectionState
    })

    const [sendOutboundMessageFromView, getExternalUserId] = (userType === "host" ? getHostSpecifics(setNewOutboundMessageData) : getGuessSpecifics(setNewOutboundMessageData)) as GetUserSpecificsReturn<UT>

    return <ChatView userType={userType} connectionState={connectionState} connectedUsersIds={connectedUsersIds} messages={messagesData} sendOutboundMessage={sendOutboundMessageFromView}  {...viewProps}/>
}

type SetNewOutboundMessageData = (b: string, to: number[]) => void
type GetExternalUserId<UT extends UserType> = (ui: GuessId<UT> | string ) => number
type GetUserSpecificsReturn<UT extends UserType> =  [SendOutboundMessageFromView<UT>, GetExternalUserId<UT>]
type GetUserSpecifics<UT extends UserType> = (setNewOutboundMessageData: SetNewOutboundMessageData) => GetUserSpecificsReturn<UT>

const getHostSpecifics: GetUserSpecifics<"host"> = (setNewOutboundMessageData) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"host"> = (body, toGuessesIds) => {
        setNewOutboundMessageData(body, toGuessesIds.map(ui => parseInt(ui)))
    }
    const getGuessId: GetExternalUserId<"host"> = (gi) => typeof gi === "string" ? parseInt(gi) : gi

    return [sendOutboundMessageFromView, getGuessId]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = (setNewOutboundMessageData) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"guess"> = (body, toUsersIds) => {
        // toUsersIds will be undefined
        setNewOutboundMessageData(body, [HOST_ID])
    }
    const getHostId: GetExternalUserId<"guess"> = () => HOST_ID

    return [sendOutboundMessageFromView, getHostId]
}
