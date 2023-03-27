import {UserType} from "chat-common/src/model/types"
import {
    InboundConMessageParts,
    InboundDisMessageParts,
    InboundMesMessageParts
} from "../../types/chat"
import ChatView, {ContainerProps, MessageData} from "./View"
import useWebSocket, {
    HandleAckMessage,
    HandleConMessage,
    HandleDisMessage,
    HandleMesMessage, SendMessage
} from "../../hooks/useWebSocket"
import {useState} from "react"

export type FirstHandleConMessage<UT extends UserType> = (cm: InboundConMessageParts<UT>) => string
export type FirstHandleDisMessage<UT extends UserType> = (dm: InboundDisMessageParts<UT>) => string
export type FirstHandleMesMessage<UT extends UserType> = (mm: InboundMesMessageParts<UT>) => string

type Props<UT extends UserType> = {
    userType: UT
    firstHandleConMessage: FirstHandleConMessage<UT>
    firstHandleDisMessage: FirstHandleDisMessage<UT>
    firstHandleMesMessage: FirstHandleMesMessage<UT>
    viewContainerProps: ContainerProps
}

export const LOCAL_USER = "me"

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          firstHandleConMessage,
                                                          firstHandleDisMessage,
                                                          firstHandleMesMessage,
                                                          viewContainerProps
                                                      }: Props<UT>) {
    const [connectedUsers, setConnectedUsers] = useState<string[]>([])
    const setConnectedUser = (user: string) => {
        setConnectedUsers((users) => [...users, user])
    }
    const removeConnectedUser = (user: string) => {
        setConnectedUsers((users) => {
            const updatedUser = [...users]
            updatedUser.splice(users.findIndex((u) => u === user), 1)
            return updatedUser
        })
    }
    const [messagesData, setMessagesData] = useState<MessageData[]>([])
    const setMessageData = (md: MessageData) => {
        setMessagesData((messagesData) => [...messagesData, md])
    }
    // I AM NOT SURE IF THIS IMPLEMENTATION IS CORRECT
    const setLocalMessageData = (body: string, sendMessage: SendMessage) => {
        setMessagesData((messages) => {
            const number = messages.length
            sendMessage(number, body)
            const message = {user: LOCAL_USER, number: number, body: body, ack: false}
            return [...messages, message]

        })
    }
    const acknowledgeMessage = (number: number) => {
        setMessagesData((messages) => {
            const updatedMessages = [...messages]
            updatedMessages[number].ack = true
            return updatedMessages
        })
    }

    const handleConMessage: HandleConMessage<UT> = (cm) => {
        const user = firstHandleConMessage(cm)
        setConnectedUser(user)
    }
    const handleDisMessage: HandleDisMessage<UT> = (dm) => {
        const user = firstHandleDisMessage(dm)
        removeConnectedUser(user)
    }
    const handleMesMessage: HandleMesMessage<UT> = (mm) => {
        const user = firstHandleMesMessage(mm)
        setMessageData({user: user, number: mm.number, body: mm.body, ack: true})
    }
    const handleAckMessage: HandleAckMessage<UT> = (n) => {
        acknowledgeMessage(n)
    }

    const sendMessage = useWebSocket({
        userType: userType,
        handleConMessage: handleConMessage,
        handleDisMessage: handleDisMessage,
        handleMesMessage: handleMesMessage,
        handleAckMessage: handleAckMessage
    })
    const sendMessageWrapper = (body: string) => {
        setLocalMessageData(body, sendMessage)
    }

    return <ChatView users={connectedUsers} messages={messagesData} sendMessage={sendMessageWrapper} containerProps={viewContainerProps}/>
}
