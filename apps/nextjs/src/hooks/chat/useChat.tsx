import {UserType} from "chat-common/src/model/types"
import View, {ContainerProps, Hide, SetOutboundMessageData as SetOutboundMessageDataFromView} from "./useView"
import useWebSocket, {
    ConnectionState,
    HandleConMessage,
    HandleDisMessage,
    HandleMesMessage,
    HandleNewConnectionState,
    HandleServerAckMessage,
    HandleUserAckMessage,
    HandleUsersMessage
} from "./useWebSocket"
import {useState} from "react"
import {getParsedUsersMessageBody} from "chat-common/src/message/functions"
import {LOCAL_USER_ID, LOCAL_USER_NAME, User, useUsers} from "./useUsers"
import {useMessages} from "./useMessages"
import useView from "./useView"
import { PositionCSS, SizeCSS } from "../../components/ResizableDraggableDiv"

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
    viewProps: {position?: PositionCSS, size?: SizeCSS, allowHide: boolean, handleOnClickHide?: () => void}
}

export default function useChat<UT extends UserType>({
                                                          userType,
                                                          handleUsersConnection,
                                                          handleUsersDisconnection,
                                                          handleUserMessage,
                                                          connect,
                                                          nextHandleNewConnectionState,
                                                          viewProps
                                                      }: Props<UT>): [(visible: boolean) => void, JSX.Element] {
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

    const [messagesData, setInboundMessageData, setOutboundMessageData, setMessageAsAcknowledgedByServer, isMessageAckByServer, setMessageAsAcknowledgedByUser, useSendPendingMessages] = useMessages(userType)
    useSendPendingMessages((number, body, usersIds)=> { sendMesMessage(number, body, usersIds) })

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

    const setOutboundMessageDataFromView: SetOutboundMessageDataFromView = (body) => {
        const targetUsers = users.filter((u) => u.id !== LOCAL_USER_ID && isTargetUser(u))
        const setMessage = targetUsers.length > 0
        if (setMessage) {
            setOutboundMessageData(body, targetUsers.map(tu => tu.id))
        }
        return setMessage
    }

    const sendMesMessage = useWebSocket({
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
        handleNewConnectionState
    })

    const [isTargetUser] = userType === "host" ? getHostSpecifics() : getGuessSpecifics()

    return useView({userType, connectionState, users, selectOrUnselectUser, getUserColor, messages: messagesData, setOutboundMessageData: setOutboundMessageDataFromView, ...viewProps})
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
