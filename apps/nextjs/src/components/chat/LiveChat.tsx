import {AccountedUserData, UserType} from "chat-common/src/model/types"
import {InboundMesMessageParts} from "../../types/chat"
import ChatView, {ContainerProps, Hide, SetNewOutboundMessageData as SetNewOutboundMessageDataFromView} from "./View"
import useWebSocket, {
    AddPendingUserAckMessage,
    ConnectionState,
    HandleConMessage,
    HandleDisMessage,
    HandleMesMessage,
    HandleNewConnectionState,
    HandleServerAckMessage,
    HandleUserAckMessage,
    HandleUsersMessage,
    IsMessageAckByServer,
} from "../../hooks/useWebSocket"
import {useEffect, useRef, useState} from "react"
import {getParsedUsersMessageBody} from "chat-common/src/message/functions"
import {getRandomColor} from "utils/src/random"
import {ChangePropertyType} from "utils/src/types"

type MessageDataCommon = { fromUserId: number, fromUserName: string, number: number, body: string}
export type InboundMessageData = { flow: "in" } & MessageDataCommon
const userAckStates = {pen: "pen", ack: "ack", nack: "nack"} as const
export type UserAckState = typeof userAckStates[keyof typeof userAckStates]
type ToUsersId = Map<number, UserAckState>
export type OutboundMessageData = { flow: "out", toUsersIds: ToUsersId, serverAck: boolean } & MessageDataCommon
export type MessageData = InboundMessageData | OutboundMessageData

export type User = AccountedUserData & { selected: boolean, color: string }
export const LOCAL_USER_ID = -1
export const LOCAL_USER_NAME = "me"
export type SelectOrUnselectUser = (index: number) => void
export type GetUserColor = (id: number) => string

export type HandleUsersConnection = (names: string[]) => void
export type HandleUsersDisconnection = (names: string[]) => void
export type HandleUserMessage<UT extends UserType> = (mm: InboundMesMessageParts<UT>) => void

type Props<UT extends UserType> = {
    userType: UT
    handleUsersConnection: HandleUsersConnection
    handleUsersDisconnection: HandleUsersDisconnection
    handleUserMessage: HandleUserMessage<UT>
    getOppositeUserName: (id: number) => string
    connect: boolean
    nextHandleNewConnectionState: HandleNewConnectionState
    viewProps: { containerProps: ContainerProps, hide?: Hide }
}
//export const HOST_ID = 1

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          handleUsersConnection,
                                                          handleUsersDisconnection,
                                                          handleUserMessage,
                                                          connect,
                                                          getOppositeUserName,
                                                          nextHandleNewConnectionState,
                                                          viewProps
                                                      }: Props<UT>) {
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        setConnectionState(cs)
        switch (cs) {
            case ConnectionState.CONNECTED :
                setConnectedUser(LOCAL_USER_ID, LOCAL_USER_NAME, Date.now())
                break
            case ConnectionState.DISCONNECTED :
                setDisconnectedAllUsers()
        }
        nextHandleNewConnectionState(cs)
    }

    const [users, setUsers] = useState<User[]>([])
    const setUsersConnections = (...targetUsers: AccountedUserData[]) => {
        const connectedUsersNames: string[] = []
        const disconnectedUsersNames: string[] = []
        setUsers((users) => {
            const updatedUsers = [...users]
            for (const {id, name, isConnected, date} of targetUsers) {
                const user = updatedUsers.find(u => u.id === id)
                if (user) {
                    if (date && (date > (user.date ?? 0))) {
                        user.date = date
                        if (isConnected) {
                            user.isConnected = true
                            connectedUsersNames.push(name)
                        } else {
                            user.isConnected = false
                            disconnectedUsersNames.push(name)
                        }
                    }
                } else {
                    updatedUsers.push({id, name, isConnected, date, selected: false, color: getUserColor(id)})
                    if (isConnected) {
                        connectedUsersNames.push(name)
                    }
                }
            }
            return updatedUsers
        })
        if (connectedUsersNames.length > 0)
            handleUsersConnection(connectedUsersNames)
        if (disconnectedUsersNames.length > 0)
            handleUsersDisconnection(connectedUsersNames)
    }
    const setConnectedUser = (id: number, name: string, date: number) => {
        setUsersConnections({id, name, isConnected: true, date})
    }
    const setDisconnectedUser = (id: number, name: string, date: number) => {
        setUsersConnections({id, name, isConnected: false, date})
    }
    const setDisconnectedAllUsers = () => {
        setUsers((users) => {
            const updatedUsers = [...users]
            updatedUsers.forEach(u => u.isConnected = false)
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
    const userColorMapRef = useRef(new Map<number, string>([[LOCAL_USER_ID, "black"]]))
    const getUserColorMap = () => userColorMapRef.current
    const getUserColor: GetUserColor = (id) => {
        let color = getUserColorMap().get(id)
        if (!color) {
            color = getRandomColor()
            getUserColorMap().set(id, color)
        }
        return color
    }

    const [messagesData, setMessagesData] = useState<MessageData[]>([])
    const getOutboundMessageData = (n: number) => {
        const outboundMessageData = messagesData[n]
        if (outboundMessageData.flow !== "out") {
            throw new Error("message " + JSON.stringify(outboundMessageData) + " is not an outbound message")
        }
        return outboundMessageData
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
        const pendingMessages = getPendingUserAckMessages().get(userId)
        if (pendingMessages) {
            const index = pendingMessages.findIndex(n => n === number)
            if (index >= 0)
                pendingMessages.splice(index, 1)
            if (pendingMessages.length === 0) {
                getPendingUserAckMessages().delete(userId)
            }
        }
    }

    type UsersInLocalStorage = Pick<User, "id" | "name" | "color">[]
    const usersLocalStorageKey = "users:" + userType

    type MessagesInLocalStorage = (InboundMessageData | ChangePropertyType<OutboundMessageData, ["toUsersIds", [number, UserAckState][]]>)[]
    const messagesLocalStorageKey = "messagesData:" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        localStorage.setItem(usersLocalStorageKey, JSON.stringify(users.map(({id, name, color}) => ({id, name, color}))))
        localStorage.setItem(messagesLocalStorageKey, JSON.stringify(messagesData.map(md => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: Array.from(toUsersIds.entries())}))(md))))
    }
    useEffect(() => {
        const usersJson = localStorage.getItem(usersLocalStorageKey)
        if (usersJson) {
            const users: User[] = [];
            (JSON.parse(usersJson) as UsersInLocalStorage)
                .forEach(({id, name, color}) => {
                    users.push({id, name, color, isConnected: false, selected: false})
                    getUserColorMap().set(id, color)
                })
            setUsers(users)
        }

        const messagesJson = localStorage.getItem(messagesLocalStorageKey)
        if (messagesJson)
            setMessagesData((JSON.parse(messagesJson) as MessagesInLocalStorage).map((md) => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: new Map(toUsersIds)}))(md)))
    }, [])
    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [users, messagesData])

    const handleUsersMessage: HandleUsersMessage<UT> = (um) => {
        const users = getParsedUsersMessageBody(um.body)
        setUsersConnections(...users)
    }
    const handleConMessage: HandleConMessage<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleConMessage(cm)
        setConnectedUser(userId, userName, date)
    }
    const handleDisMessage: HandleDisMessage<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleDisMessage(dm)
        setDisconnectedUser(userId, userName, date)
    }
    const handleMesMessage: HandleMesMessage<UT> = (mm) => {
        handleUserMessage(mm)
        setInboundMessageData({flow: "in", fromUserId: mm.userId, fromUserName: getOppositeUserName(mm.userId), number: mm.number, body: mm.body})
    }
    const handleServerAckMessage: HandleServerAckMessage = (n) => {
        setMessageAsAcknowledgedByServer(n)
    }
    const handleUserAckMessage: HandleUserAckMessage = (n, ui) => {
        setMessageAsAcknowledgedByUser(n, ui)
    }

    const sendOutboundMesMessage = useWebSocket({
        userType,
        handleUsersMessage,
        handleConMessage,
        handleDisMessage,
        handleMesMessage,
        handleServerAckMessage,
        handleUserAckMessage,
        isMessageAckByServer,
        addPendingUserAckMessage,
        connect,
        handleNewConnectionState
    })

    const setNewOutboundMessageDataFromView: SetNewOutboundMessageDataFromView = (body) => {
        const targetUsers = users.filter((u) => u.id !== LOCAL_USER_ID && isTargetUser(u))
        const setMessage = targetUsers.length > 0
        if (setMessage) {
            setNewOutboundMessageData(body, targetUsers.map(tu => tu.id))
        }
        return setMessage
    }

    const [isTargetUser] = userType === "host" ? getHostSpecifics() : getGuessSpecifics()

    return <ChatView userType={userType} connectionState={connectionState} users={users} selectOrUnselectUser={selectOrUnselectUser} getUserColor={getUserColor} messages={messagesData} setNewOutboundMessageData={setNewOutboundMessageDataFromView}  {...viewProps}/>
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
