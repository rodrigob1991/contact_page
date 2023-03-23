import {UserType} from "chat-common/src/model/types"
import {InboundToGuessMessage, InboundToHostMessage} from "../components/home/header/messenger/chat/types"
import {useEffect, useRef} from "react"

type Props<UT extends UserType> = {
    userType: UT
    onMessage: (m: (UT extends "host" ? InboundToHostMessage : InboundToGuessMessage)) => void

}
export default function useWebSocket<UT extends UserType>({userType, onMessage}: Props<UT>) {
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

    const sendMessage = (body: string) => {

    }

    return sendMessage
}