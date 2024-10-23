import { getParsedUsersMessageBody } from "chat-common/src/message/functions"
import { UserType } from "chat-common/src/model/types"
import { useState } from "react"
import { useMessages } from "../../chat/useMessages"
import { LOCAL_USER_ID, LOCAL_USER_NAME, User, useUsers } from "../../chat/useUsers"
import useWebSocket, {
    ConMessageHandler,
    ConnectedHandler,
    ConnectingHandler,
    DisMessageHandler,
    DisconnectedHandler,
    MesMessageHandler,
    ServerAckMessageHandler,
    UserAckMessageHandler,
    UsersMessageHandler
} from "../../chat/useWebSocket"
import useView, { SetOutboundMessageData as SetOutboundMessageDataFromView } from "./useView"
import { PositionCSS } from "utils/src/css/position"
import { SizeCSS } from "utils/src/css/size"

export enum ConnectionState { CONNECTED, DISCONNECTED, CONNECTING}
export type UsersConnectionHandler = (names: string[]) => void
export type UsersDisconnectionHandler = (names: string[]) => void
export type UserMessageHandler = (userName: string, messageBody: string) => void

type Props<UT extends UserType> = {
    userType: UT
    usersConnectionHandler: UsersConnectionHandler
    usersDisconnectionHandler: UsersDisconnectionHandler
    userMessageHandler: UserMessageHandler
    connect: boolean
    connectingHandler: ConnectingHandler
    connectedHandler: ConnectedHandler
    disconnectedHandler: DisconnectedHandler
    viewProps: {position?: PositionCSS, size?: SizeCSS, allowHide: boolean, onHideHandler?: () => void}
}

export default function useChat<UT extends UserType>({
                                                          userType,
                                                          usersConnectionHandler,
                                                          usersDisconnectionHandler,
                                                          userMessageHandler,
                                                          connect,
                                                          connectingHandler: nextConnectingHandler,
                                                          connectedHandler: nextConnectedHandler,
                                                          disconnectedHandler: nextDisconnectedHandler, 
                                                          viewProps
                                                      }: Props<UT>) {
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED)

    const connectingHandler: ConnectingHandler = () => {
        setConnectionState(ConnectionState.CONNECTING)
        nextConnectingHandler()
    }
    const connectedHandler: ConnectedHandler = () => {
        setConnectionState(ConnectionState.CONNECTED)
        setConnectedUser(LOCAL_USER_ID, LOCAL_USER_NAME, Date.now())
        nextConnectedHandler()
    }
    const disconnectedHandler: DisconnectedHandler = () => {
        setConnectionState(ConnectionState.DISCONNECTED)
        setDisconnectedAllUsers()
        nextDisconnectedHandler()
    }

    const [users, setUsers, getUserColor, setConnectedUser, setDisconnectedUser, setDisconnectedAllUsers, selectOrUnselectUser] = useUsers(userType)

    const [messagesData, setInboundMessageData, setOutboundMessageData, setMessageAsAcknowledgedByServer, isMessageAckByServer, setMessageAsAcknowledgedByUser, useSendPendingMessages] = useMessages(userType)
    useSendPendingMessages((number, body, usersIds)=> { sendMesMessage(number, body, usersIds) })

    const usersMessageHandler: UsersMessageHandler<UT> = (um) => {
        const users = getParsedUsersMessageBody(um.body)
        setUsers(...users)
    }
    const conMessageHandler: ConMessageHandler<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleConMessage(cm)
        setConnectedUser(userId, userName, date)
    }
    const disMessageHandler: DisMessageHandler<UT> = ({number: date, userId, body: userName}) => {
        //firstHandleDisMessage(dm)
        setDisconnectedUser(userId, userName, date)
    }
    const mesMessageHandler: MesMessageHandler<UT> = ({number, body, userId}) => {
        // handle this rare situation when the user of the message is not found.
        // maybe include the user name in the mes message and set a new user.
        const userName = users.find(u => u.id === userId)?.name ?? "userNotFound"
        userMessageHandler(userName, body)
        setInboundMessageData({flow: "in", fromUserId: userId, fromUserName: userName, number, body})
    }
    const serverAckMessageHandler: ServerAckMessageHandler = (n) => {
        setMessageAsAcknowledgedByServer(n)
    }
    const userAckMessageHandler: UserAckMessageHandler = (n, ui) => {
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
        usersMessageHandler,
        conMessageHandler,
        disMessageHandler,
        mesMessageHandler,
        serverAckMessageHandler,
        userAckMessageHandler,
        isMessageAckByServer,
        // addPendingUserAckMessage,
        connect,
        connectingHandler,
        connectedHandler,
        disconnectedHandler
    })

    const [isTargetUser] = userType === "host" ? getHostSpecifics() : getGuessSpecifics()

    return {connectionState, ...useView({userType, connectionState, users, selectOrUnselectUser, getUserColor, messages: messagesData, setOutboundMessageData: setOutboundMessageDataFromView, ...viewProps})}
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
