import {UserType} from "chat-common/src/model/types"
import {InboundConMessageParts, InboundDisMessageParts, InboundMesMessageParts} from "../../types/chat"
import ChatView, {ContainerProps, Hide, MessageData} from "./View"
import useWebSocket, {
    GuessesIds,
    HandleAckMessage,
    HandleConMessage,
    HandleDisMessage,
    HandleMesMessage, SendMesMessage
} from "../../hooks/useWebSocket"
import {useEffect, useRef, useState} from "react"

export type FirstHandleConMessage<UT extends UserType> = (cm: InboundConMessageParts<UT>) => string
export type FirstHandleDisMessage<UT extends UserType> = (dm: InboundDisMessageParts<UT>) => string
export type FirstHandleMesMessage<UT extends UserType> = (mm: InboundMesMessageParts<UT>) => string

type Props<UT extends UserType> = {
    userType: UT
    firstHandleConMessage: FirstHandleConMessage<UT>
    firstHandleDisMessage: FirstHandleDisMessage<UT>
    firstHandleMesMessage: FirstHandleMesMessage<UT>
    viewProps: { containerProps: ContainerProps, hide?: Hide }
}

export const LOCAL_USER_ID = "me"

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          firstHandleConMessage,
                                                          firstHandleDisMessage,
                                                          firstHandleMesMessage,
                                                          viewProps
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
    const setInboundMessageData = (md: MessageData) => {
        setMessagesData((messagesData) => [...messagesData, md])
    }
    const refToMessagesNumbersToSend = useRef<number[]>([])
    const getMessagesNumbersToSend = () => refToMessagesNumbersToSend.current

    const setOutboundMessageData = (body: string, toUsersIds?: string[]) => {
        setMessagesData((messagesData) => {
            const number = messagesData.length
            getMessagesNumbersToSend().push(number)
            const messageData = {fromUserId: LOCAL_USER_ID, toUsersIds: toUsersIds, number: messagesData.length, body: body, ack: false}

            return [...messagesData, messageData]
        })
    }
    useEffect(() => {
        getMessagesNumbersToSend().forEach((n)=> {
            const {body, number, toUsersIds} = messagesData[n]
            sendMessage(number, body, (toUsersIds ? toUsersIds.map((ui)=> parseInt(ui)): undefined) as GuessesIds<UT>)
        })
        getMessagesNumbersToSend().splice(0, getMessagesNumbersToSend().length)

    }, [messagesData])

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
        const userId = firstHandleMesMessage(mm)
        setInboundMessageData({fromUserId: userId, number: mm.number, body: mm.body, ack: true})
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
    }) as  SendMesMessage<UT>

    const sendMessageFromView = (body: string, guessesIds?: string[]) => {
        setOutboundMessageData(body, guessesIds)
    }

    return <ChatView userType={userType} usersIds={connectedUsers} messages={messagesData} sendMessage={sendMessageFromView} {...viewProps}/>
}
