import {UserType} from "chat-common/src/model/types"
import {
    InboundAckMessageParts,
    InboundConMessageParts,
    InboundDisMessageParts,
    InboundMesMessageParts
} from "../types/chat"
import {useEffect, useRef} from "react"

export type HandleConMessage<UT extends UserType> =  (cm: InboundConMessageParts<UT>) => void
export type HandleDisMessage<UT extends UserType> =  (dm: InboundDisMessageParts<UT>) => void
export type HandleMesMessage<UT extends UserType> =  (mm: InboundMesMessageParts<UT>) => void
export type HandleAckMessage<UT extends UserType> =  (n: number) => void

export type SendMessage = (number: number, body: string) => void

export type Props<UT extends UserType> = {
    userType: UT
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
    handleAckMessage: HandleAckMessage<UT>
}

export default function useWebSocket<UT extends UserType>({
                                                              userType,
                                                              handleConMessage,
                                                              handleDisMessage,
                                                              handleMesMessage,
                                                              handleAckMessage
                                                          }: Props<UT>) {
    const wsEndpoint = `${process.env.WEBSOCKET_ENDPOINT}${userType === "host" ? "?host_user=" + process.env.PRIVATE_TOKEN : ""}`
    const refToWs = useRef<WebSocket>()
    const setWs = (ws: WebSocket) => {
        refToWs.current = ws
    }
    const getWs = () => refToWs.current as WebSocket

    useEffect(() => {
            setWs(new WebSocket(wsEndpoint))
            getWs().onmessage = (m) => {

            }
            return () => {
                getWs().close()
            }
        }
        , [])

    const sendMessage: SendMessage = (number, body) => {
        return number

    }

    return sendMessage
}