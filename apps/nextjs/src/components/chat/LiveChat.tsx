import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {
    ContainerProps,
    Hide,
    SelectOrUnselectUser,
    SetNewOutboundMessageData as SetNewOutboundMessageDataFromView
} from "./View"
import useWebSocket, {
    AddPendingUserAckMessage,
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

type MessageDataCommon = { fromUserId: number, fromUserName: string, number: number, body: string}
export type InboundMessageData = { flow: "in" } & MessageDataCommon
const userAckStates = {pen: "pen", ack: "ack", nack: "nack"} as const
export type UserAckState = typeof userAckStates[keyof typeof userAckStates]
type ToUsersId = Map<number, UserAckState>
export type OutboundMessageData = { flow: "out", toUsersIds: ToUsersId, serverAck: boolean } & MessageDataCommon
export type MessageData = InboundMessageData | OutboundMessageData

export type User = { id: number, name: string, connected: boolean, selected: boolean }
export const LOCAL_USER_ID = -1
export const LOCAL_USER_NAME = "me"

export type FirstHandleConMessage<UT extends UserType> = (cm: InboundConMessageParts<UT>) => string
export type FirstHandleDisMessage<UT extends UserType> = (dm: InboundDisMessageParts<UT>) => void
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
//export const HOST_ID = 1

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          firstHandleConMessage,
                                                          firstHandleDisMessage,
                                                          firstHandleMesMessage,
                                                          connect,
                                                          nextHandleNewConnectionState,
                                                          viewProps
                                                      }: Props<UT>) {
    const [users, setUsers] = useState<User[]>([])
    const setConnectedUser = (id: number, name: string) => {
        setUsers((users) => {
            const updatedUsers = [...users]
            const user = updatedUsers.find(u => u.id === id)
            if (user) {
                user.connected = true
            } else {
                updatedUsers.push({id, name, connected: true, selected: false})
            }
            return updatedUsers
        })
    }
    const setDisconnectedUser = (id: number) => {
        setUsers((users) => {
            const updatedUsers = [...users]
            const user = updatedUsers.find(u => u.id === id)
            // should always exist
            if (user) {
                user.connected = false
            }
            return updatedUsers
        })
    }
    const setDisconnectedUsers = () => {
        setUsers((users) => {
            const updatedUsers = [...users]
            updatedUsers.forEach(u => u.connected = false)
            return updatedUsers
        })
    }
    const selectOrUnselectUser: SelectOrUnselectUser = (index) => {
        setUsers((users) => {
            const updatedUsers = [...users]
            const user = updatedUsers[index]
            user.selected = !user.selected

            return updatedUsers
        })
    }
    //const getSelectedUsers = () => users.filter(u => u.selected)

    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        setConnectionState(cs)
        switch (cs) {
            case ConnectionState.CONNECTED :
                setConnectedUser(LOCAL_USER_ID, LOCAL_USER_NAME)
                break
            case ConnectionState.DISCONNECTED :
                //setAllMessagesAsNack()
                setDisconnectedUsers()
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

    const setNewOutboundMessageData = (body: string, toUsersIds: number[]) => {
        setMessagesData((messagesData) => {
            const number = messagesData.length
            getOutboundMessagesNumbersToSend().push(number)
            const messageData: OutboundMessageData = {flow: "out", fromUserId: LOCAL_USER_ID, fromUserName: LOCAL_USER_NAME, toUsersIds: new Map(toUsersIds.map(ui => [ui, "pen"])), number: number, body: body, serverAck: false}
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
    /*const setMessagesAsNack = (indexesByUserId: [[number, number[]]]) => {
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
    }*/
    const usersIdsKey = "usersIds-" + userType
    const messagesDataKey = "messagesData-" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        console.log("users ids store " + JSON.stringify(users.map(u => u.id)))
        localStorage.setItem(usersIdsKey, JSON.stringify(users.map(({id, name}) => [id, name])))
        console.log("messages data store " + JSON.stringify(messagesData))
        localStorage.setItem(messagesDataKey, JSON.stringify(messagesData.map(md => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: Array.from(toUsersIds.entries())}))(md))))
    }
    useEffect(() => {
        const usersIdsJson = localStorage.getItem(usersIdsKey)
        console.log("users ids stored " + usersIdsJson)
        if (usersIdsJson)
            setUsers((JSON.parse(usersIdsJson) as [number, string][]).map(([id, name]) => ({id, name, connected: false, selected: false})))

        const messagesJson = localStorage.getItem(messagesDataKey)
        console.log("messages data stored " + messagesJson)
        if (messagesJson)
            setMessagesData(JSON.parse(messagesJson).map((md: MessageData) => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: new Map(toUsersIds)}))(md)))
    }, [])
    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [users, messagesData])

    const handleConMessage: HandleConMessage<UT> = (cm) => {
        const userName = firstHandleConMessage(cm)
        setConnectedUser(cm.userId, userName)
    }
    const handleDisMessage: HandleDisMessage<UT> = ({userId}) => {
        //const userId = firstHandleDisMessage(dm)
        //setUserMessagesAsNack(getExternalUserId(userId))
        setDisconnectedUser(userId)
    }
    const handleMesMessage: HandleMesMessage<UT> = (mm) => {
        const userName = firstHandleMesMessage(mm)
        setInboundMessageData({flow: "in", fromUserId: mm.userId, fromUserName: userName, number: mm.number, body: mm.body})
    }
    const handleServerAckMessage: HandleServerAckMessage = (n) => {
        setMessageAsAcknowledgedByServer(n)
    }
    const handleUserAckMessage: HandleUserAckMessage = (n, ui) => {
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
        addPendingUserAckMessage: addPendingUserAckMessage,
        connect: connect,
        handleNewConnectionState: handleNewConnectionState
    })

    const setNewOutboundMessageDataFromView: SetNewOutboundMessageDataFromView = (body) => {
        const targetUsers = users.filter(isTargetUser)
        const setMessage = targetUsers.length > 0
        if (setMessage) {
            setNewOutboundMessageData(body, targetUsers.map(tu => tu.id))
        }
        return setMessage
    }

    const [isTargetUser] = userType === "host" ? getHostSpecifics() : getGuessSpecifics()

    return <ChatView userType={userType} connectionState={connectionState} users={users} selectOrUnselectUser={selectOrUnselectUser} messages={messagesData} setNewOutboundMessageData={setNewOutboundMessageDataFromView}  {...viewProps}/>
}

type IsTargetUser = (user: User) => boolean
type GetUserSpecificsReturn = [IsTargetUser]
type GetUserSpecifics<UT extends UserType> = () => GetUserSpecificsReturn

const getHostSpecifics: GetUserSpecifics<"host"> = () => {
    const isTargetUser: IsTargetUser = (u) => u.selected
    return [isTargetUser]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const isTargetUser: IsTargetUser = (u) => true
    return [isTargetUser]
}
