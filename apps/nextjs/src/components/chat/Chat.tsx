import {UserType} from "chat-common/src/model/types"
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
} from "../../hooks/chat/useWebSocket"
import {useEffect, useRef, useState} from "react"
import {getParsedUsersMessageBody} from "chat-common/src/message/functions"
import {LOCAL_USER_ID, LOCAL_USER_NAME, User, useUsers} from "../../hooks/chat/useUsers";
import { useMessages } from "../../hooks/chat/useMessages"

export type HandleUsersConnection = (names: string[]) => void
export type HandleUsersDisconnection = (names: string[]) => void
export type HandleUserMessage = (userName: string, messageBody: string) => void

type Props<UT extends UserType> = {
    userType: UT
    handleUsersConnection: HandleUsersConnection
    handleUsersDisconnection: HandleUsersDisconnection
    handleUserMessage: HandleUserMessage
    connect: boolean
    nextHandleNewConnectionState: HandleNewConnectionState
    viewProps: { containerProps: ContainerProps, hide?: Hide }
}
//export const HOST_ID = 1

export default function Chat<UT extends UserType>({
                                                          userType,
                                                          handleUsersConnection,
                                                          handleUsersDisconnection,
                                                          handleUserMessage,
                                                          connect,
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

    const [users, setUsers, getUserColor, setConnectedUser, setDisconnectedUser, setDisconnectedAllUsers, selectOrUnselectUser] = useUsers(userType)

    const [messagesData] = useMessages(sendOutboundMesMessage)

    const handleUsersMessage: HandleUsersMessage<UT> = (um) => {
        const users = getParsedUsersMessageBody(um.body)
        setUsers(...users)
    }
    const handleConMessage: HandleConMessage<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleConMessage(cm)
        setConnectedUser(userId, userName, date)
    }
    const handleDisMessage: HandleDisMessage<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleDisMessage(dm)
        setDisconnectedUser(userId, userName, date)
    }
    const handleMesMessage: HandleMesMessage<UT> = ({number, body, userId}) => {
        // handle this rare situation when the user of the message is not found.
        // maybe include the user name in the mes message and set a new user.
        const userName = users.find(u => u.id === userId)?.name ?? "userNotFound"
        handleUserMessage(userName, body)
        setInboundMessageData({flow: "in", fromUserId: userId, fromUserName: userName, number, body})
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
