import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {
    ContainerProps,
    Hide,
    SelectOrUnselectConnectedUser,
    SendOutboundMessage as SendOutboundMessageFromView
} from "./View"
import useWebSocket, {
    AddPendingUserAckMessage,
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
export type UserAckState = typeof userAckStates[keyof typeof userAckStates]
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

export type ConnectedUser = { id: string, selected: boolean }
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
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
    const setConnectedUser = (id: string) => {
        setConnectedUsers((users) => [...users, {id: id, selected: false}])
    }
    const removeConnectedUser = (id: string) => {
        setConnectedUsers((users) => {
            const updatedUsers = [...users]
            updatedUsers.splice(users.findIndex((user) => user.id === id), 1)
            return updatedUsers
        })
    }
    const selectOrUnselectConnectedUser: SelectOrUnselectConnectedUser = (index) => {
        setConnectedUsers((connectedUsers) => {
            const updatedConnectedUsers = [...connectedUsers]
            const targetConnectedUser = updatedConnectedUsers[index]
            targetConnectedUser.selected = !targetConnectedUser.selected

            return updatedConnectedUsers
        })
    }
    const getSelectedConnectedUsers = () => connectedUsers.filter(u => u.selected)

    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        setConnectionState(cs)
        switch (cs) {
            case ConnectionState.CONNECTED :
                setConnectedUser(LOCAL_USER_ID)
                break
            case ConnectionState.DISCONNECTED :
                setAllMessagesAsNack()
                setConnectedUsers([])
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
        removePendingUserAckMessage(number, userId)
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
    const pendingUserAckMessagesRef = useRef(new Map<number, number[]>)
    const getPendingUserAckMessages = () => pendingUserAckMessagesRef.current
    const addPendingUserAckMessage: AddPendingUserAckMessage = (number, userId) => {
        let pendingMessages = getPendingUserAckMessages().get(userId)
        if (!pendingMessages) {
            pendingMessages = []
            getPendingUserAckMessages().set(userId, pendingMessages)
        }
        pendingMessages.push(number)
    }
    const removePendingUserAckMessage = (number: number, userId: number) => {
        let pendingMessages = getPendingUserAckMessages().get(userId)
        if (pendingMessages) {
            const index = pendingMessages.findIndex(n => n === number)
            if (index >= 0)
                pendingMessages.splice(index, 1)
            if (pendingMessages.length === 0) {
                getPendingUserAckMessages().delete(userId)
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
        if (getPendingUserAckMessages().size > 0) {
            setMessagesAsNack([...getPendingUserAckMessages().entries()] as [[number, number[]]])
        }
    }
    const setUserMessagesAsNack = (userId: number) => {
        const pendingToAckMessages = getPendingUserAckMessages().get(userId)
        if (pendingToAckMessages) {
            setMessagesAsNack([[userId, pendingToAckMessages]])
        }
    }

    const handleConMessage: HandleConMessage<UT> = (cm) => {
        const userId = firstHandleConMessage(cm)
        setConnectedUser(userId)
    }
    const handleDisMessage: HandleDisMessage<UT> = (dm) => {
        const userId = firstHandleDisMessage(dm)
        setUserMessagesAsNack(getExternalUserId(userId))
        removeConnectedUser(userId)
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
        addPendingUserAckMessage: addPendingUserAckMessage,
        connect: connect,
        handleNewConnectionState: handleNewConnectionState
    })

    const [sendOutboundMessageFromView, getExternalUserId] = (userType === "host" ? getHostSpecifics(setNewOutboundMessageData, getSelectedConnectedUsers) : getGuessSpecifics(setNewOutboundMessageData, undefined)) as GetUserSpecificsReturn<UT>

    return <ChatView userType={userType} connectionState={connectionState} connectedUsers={connectedUsers} selectOrUnselectConnectedUser={selectOrUnselectConnectedUser} messages={messagesData} sendOutboundMessage={sendOutboundMessageFromView}  {...viewProps}/>
}

type GetSelectedConnectedUser<UT extends UserType> = UT extends "host" ? () => ConnectedUser[] : undefined
type SetNewOutboundMessageData = (b: string, to: number[]) => void
type GetExternalUserId<UT extends UserType> = (ui: GuessId<UT> | string ) => number
type GetUserSpecificsReturn<UT extends UserType> =  [SendOutboundMessageFromView<UT>, GetExternalUserId<UT>]
type GetUserSpecifics<UT extends UserType> = (setNewOutboundMessageData: SetNewOutboundMessageData, getSelectedConnectedUser: GetSelectedConnectedUser<UT>) => GetUserSpecificsReturn<UT>

const getHostSpecifics: GetUserSpecifics<"host"> = (setNewOutboundMessageData, getSelectedConnectedGuesses) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"host"> = (body) => {
        const selectedConnectedGuesses = getSelectedConnectedGuesses()
        const areSomeSelected = selectedConnectedGuesses.length > 0
        if (areSomeSelected) {
            setNewOutboundMessageData(body, selectedConnectedGuesses.map(u => parseInt(u.id)))
        }
        return areSomeSelected
    }
    const getGuessId: GetExternalUserId<"host"> = (gi) => typeof gi === "string" ? parseInt(gi) : gi

    return [sendOutboundMessageFromView, getGuessId]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = (setNewOutboundMessageData) => {
    const sendOutboundMessageFromView: SendOutboundMessageFromView<"guess"> = (body) => {
        setNewOutboundMessageData(body, [HOST_ID])
        return true
    }
    const getHostId: GetExternalUserId<"guess"> = () => HOST_ID

    return [sendOutboundMessageFromView, getHostId]
}
