import {UserType} from "chat-common/src/model/types"
import {HandleConMessage, HandleDisMessage, HandleMesMessage,} from "../../types/chat"
import ChatView from "./View"
import useWebSocket from "../../hooks/useWebSocket";

type Props<UT extends UserType> = {
    userType: UT
    handleConMessage: HandleConMessage<UT>
    handleDisMessage: HandleDisMessage<UT>
    handleMesMessage: HandleMesMessage<UT>
}

export default function LiveChat<UT extends UserType>({
                                                          userType,
                                                          handleConMessage,
                                                          handleDisMessage,
                                                          handleMesMessage
                                                      }: Props<UT>) {
    const handleConMessage: HandleConMessage<"guess"> = (c) => {

    }
    const handleDisMessage: HandleDisMessage<"guess"> = (d) => {
    }
    const handleMesMessage: HandleMesMessage<"guess"> = (m) => {
    }

    const sendMessage = useWebSocket({
        userType: "guess",
        handleConMessage: handleConMessage,
        handleDisMessage: handleDisMessage,
        handleMesMessage: handleMesMessage
    })


    return <ChatView/>
}
