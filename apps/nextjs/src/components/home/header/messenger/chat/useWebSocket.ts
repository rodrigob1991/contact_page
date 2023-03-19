import {UserType} from "chat-common/src/model/types"
import {InboundToGuessMessage, InboundToHostMessage} from "./types"

type Props<UT extends UserType> = {
    userType: UT
    onMessage: (m: (UT extends "host" ? InboundToHostMessage : InboundToGuessMessage)) => void

}
export default function useWebSocket<UT extends UserType>({}: Props<UT>) {
    const sendMessage = () => {

    }


}