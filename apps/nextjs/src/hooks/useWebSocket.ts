import {UserType} from "chat-common/src/model/types"
import {HandleConMessage, HandleDisMessage, HandleMesMessage} from "../types/chat"
import {useEffect, useRef} from "react"

type Props<UT extends UserType> = {
    userType: UT
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
}

export default function useWebSocket<UT extends UserType>({
                                                              userType, handleConMessage,
                                                              handleDisMessage,
                                                              handleMesMessage
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

    const sendMessage = (body: string) => {

    }

    return sendMessage
}