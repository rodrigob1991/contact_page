import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {
    ContainerProps,
    Hide,
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

export type User = { id: number, name: string, connectedCount: number, selected: boolean, color: string}
export const LOCAL_USER_ID = -1
export const LOCAL_USER_NAME = "me"
export type SelectOrUnselectUser = (index: number) => void
export type GetUserColor = (id: number) => string

export type FirstHandleConMessage<UT extends UserType> = (cm: InboundConMessageParts<UT>) => void
export type FirstHandleDisMessage<UT extends UserType> = (dm: InboundDisMessageParts<UT>) => void
export type FirstHandleMesMessage<UT extends UserType> = (mm: InboundMesMessageParts<UT>) => void

type Props<UT extends UserType> = {
    userType: UT
    firstHandleConMessage: FirstHandleConMessage<UT>
    firstHandleDisMessage: FirstHandleDisMessage<UT>
    firstHandleMesMessage: FirstHandleMesMessage<UT>
    getOppositeUserName: (id: number) => string
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
                                                          getOppositeUserName,
                                                          nextHandleNewConnectionState,
                                                          viewProps
                                                      }: Props<UT>) {
    const [users, setUsers] = useState<User[]>([])
    const setUserConnectedCount = (id: number, name: string, isCon: boolean) => {
        setUsers((users) => {
            const updatedUsers = [...users]
            const user = updatedUsers.find(u => u.id === id)
            const count = isCon ? 1 : -1
            if (user) {
                user.connectedCount += count
            } else {
                updatedUsers.push({id, name, connectedCount: count, selected: false, color: getUserColor(id)})
            }
            return updatedUsers
        })
    }
    const setConnectedUser = (id: number, name: string) => {
        setUserConnectedCount(id, name, true)
    }
    const setDisconnectedUser = (id: number, name: string) => {
        setUserConnectedCount(id, name, false)
    }
    const setDisconnectedUsers = () => {
        setUsers((users) => {
            const updatedUsers = [...users]
            updatedUsers.forEach(u => u.connectedCount = 0)
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
            color = getNewColor()
            getUserColorMap().set(id, color)
        }
        return color
    }
    const getNewColor = () => {
        let r, g, b, brightness
        do {
            // generate random values for R, G y B
            r = Math.floor(Math.random() * 256)
            g = Math.floor(Math.random() * 256)
            b = Math.floor(Math.random() * 256)

            // calculate the resulted brightness
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        } while (brightness < 0.22)

        const rgb = (r << 16) + (g << 8) + b
        // return the color on RGB format
        return `#${rgb.toString(16)}`
    }

    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        setConnectionState(cs)
        switch (cs) {
            case ConnectionState.CONNECTED :
                setUserConnectedCount(LOCAL_USER_ID, LOCAL_USER_NAME, true)
                break
            case ConnectionState.DISCONNECTED :
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

    const usersLocalStorageKey = "users:" + userType
    const messagesLocalStorageKey = "messagesData:" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        localStorage.setItem(usersLocalStorageKey, JSON.stringify(users.map(({id, name, color}) => [id, name, color])))
        localStorage.setItem(messagesLocalStorageKey, JSON.stringify(messagesData.map(md => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: Array.from(toUsersIds.entries())}))(md))))
    }
    useEffect(() => {
        const usersJson = localStorage.getItem(usersLocalStorageKey)
        if (usersJson) {
            const users: User[] = [];
            (JSON.parse(usersJson) as [number, string, string][])
                .forEach(([id, name, color]) => {
                    users.push({id, name, connectedCount: 0, selected: false, color: color})
                    getUserColorMap().set(id, color)
                })
            setUsers(users)
        }

        const messagesJson = localStorage.getItem(messagesLocalStorageKey)
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
        firstHandleConMessage(cm)
        setConnectedUser(cm.userId, getOppositeUserName(cm.userId))
    }
    const handleDisMessage: HandleDisMessage<UT> = (dm) => {
        firstHandleDisMessage(dm)
        setDisconnectedUser(dm.userId, getOppositeUserName(dm.userId))
    }
    const handleMesMessage: HandleMesMessage<UT> = (mm) => {
        firstHandleMesMessage(mm)
        setInboundMessageData({flow: "in", fromUserId: mm.userId, fromUserName: getOppositeUserName(mm.userId), number: mm.number, body: mm.body})
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
