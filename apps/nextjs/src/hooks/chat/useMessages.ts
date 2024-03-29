import {useEffect, useRef, useState} from "react"
import {LOCAL_USER_ID, LOCAL_USER_NAME} from "./useUsers"
import {SendMesMessage} from "./useWebSocket"
import {ChangePropertyType} from "utils/src/types"
import {UserType} from "chat-common/src/model/types"

type MessageDataCommon = { fromUserId: number, fromUserName: string, number: number, body: string}
export type InboundMessageData = { flow: "in" } & MessageDataCommon
const userAckStates = {pen: "pen", ack: "ack", nack: "nack"} as const
export type UserAckState = typeof userAckStates[keyof typeof userAckStates]
type ToUsersId = Map<number, UserAckState>
export type OutboundMessageData = { flow: "out", toUsersIds: ToUsersId, serverAck: boolean } & MessageDataCommon
export type MessageData = InboundMessageData | OutboundMessageData
export type MessagesData = MessageData[]

export type SetInboundMessageData = (imd: InboundMessageData) => void
export type SetOutboundMessageData = (body: string, toUsersIds: number[]) => void
export type SetMessageAsAcknowledgedByServer = (number: number) => void
export type IsMessageAckByServer = (n: number) => boolean
export type SetMessageAsAcknowledgedByUser = (number: number, userId: number) => void
export type UseSendPendingMessages = (sendMesMessage: SendMesMessage) => void
//export type AddPendingUserAckMessage = (n: number, ui: number) => void

export const useMessages = (userType: UserType) : [MessagesData, SetInboundMessageData, SetOutboundMessageData, SetMessageAsAcknowledgedByServer, IsMessageAckByServer, SetMessageAsAcknowledgedByUser, UseSendPendingMessages] => {
    const [messagesData, setMessagesData] = useState<MessageData[]>([])

    useStorage(userType, messagesData, setMessagesData)

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

    const setInboundMessageData : SetInboundMessageData = (md) => {
        setMessagesData((messagesData) => [...messagesData, md])
    }
    const refToOutboundMessagesNumbersToSend = useRef<number[]>([])
    const getOutboundMessagesNumbersToSend = () => refToOutboundMessagesNumbersToSend.current

    const setOutboundMessageData : SetOutboundMessageData = (body, toUsersIds) => {
        setMessagesData((messagesData) => {
            const number = messagesData.length
            getOutboundMessagesNumbersToSend().push(number)
            const messageData: OutboundMessageData = {flow: "out", fromUserId: LOCAL_USER_ID, fromUserName: LOCAL_USER_NAME, toUsersIds: new Map(toUsersIds.map(ui => [ui, "pen"])), number: number, body: body, serverAck: false}
            return [...messagesData, messageData]
        })
    }

    const useSendPendingMessages = (sendMesMessage: SendMesMessage) => {
        useEffect(() => {
            getOutboundMessagesNumbersToSend().forEach((n) => {
                const {body, number, toUsersIds} = getOutboundMessageData(n)
                console.log("sending " + body)
                sendMesMessage(number, body, [...toUsersIds.keys()])
            })
            getOutboundMessagesNumbersToSend().splice(0, getOutboundMessagesNumbersToSend().length)
        }, [messagesData])
    }

    const setMessageAsAcknowledgedByServer : SetMessageAsAcknowledgedByServer = (number) => {
        updateOutboundMessageData(number, "serverAck", true)
    }
    const isMessageAckByServer : IsMessageAckByServer = (n) => getOutboundMessageData(n).serverAck

    const setMessageAsAcknowledgedByUser : SetMessageAsAcknowledgedByUser = (number, userId) => {
        // removePendingUserAckMessage(number, userId)
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
    /*const pendingUserAckMessagesRef = useRef(new Map<number, number[]>)
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
    }*/

    return [messagesData, setInboundMessageData, setOutboundMessageData, setMessageAsAcknowledgedByServer, isMessageAckByServer, setMessageAsAcknowledgedByUser, useSendPendingMessages]
}

type MessagesInLocalStorage = (InboundMessageData | ChangePropertyType<OutboundMessageData, ["toUsersIds", [number, UserAckState][]]>)[]
const useStorage = (userType: UserType, messagesData: MessageData[], setMessagesData: (md: MessageData[]) => void) => {
    const messagesLocalStorageKey = "messagesData:" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        localStorage.setItem(messagesLocalStorageKey, JSON.stringify(messagesData.map(md => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: Array.from(toUsersIds.entries())}))(md))))
    }
    useEffect(() => {
        const messagesJson = localStorage.getItem(messagesLocalStorageKey)
        if (messagesJson)
            setMessagesData((JSON.parse(messagesJson) as MessagesInLocalStorage).map((md) => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: new Map(toUsersIds)}))(md)))
    }, [])
    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [messagesData])
}