import styled from "@emotion/styled"
import useChat, {
    HandleUserMessage,
    HandleUsersConnection, HandleUsersDisconnection
} from "../../hooks/chat/useChat"
import { HandleConnected, HandleConnecting, HandleDisconnected } from "../../hooks/chat/useWebSocket"

type Props = {}

export default function HostLiveChat({}: Props) {
    const handleGuessesConnection: HandleUsersConnection = (guessesName) => {
    }
    const handleGuessesDisconnection: HandleUsersDisconnection = (guessesName) => {
    }
    const handleGuessMessage: HandleUserMessage = (guessName, messageBody) => {
    }

    const handleConnecting: HandleConnecting = () => {
    }
    const handleConnected: HandleConnected = () => {
    }
    const handleDisconnected: HandleDisconnected = () => {
    }

    const [connectionState, setChatVisible, chatView] = useChat({userType: "host", handleConnecting, handleConnected, handleDisconnected, viewProps: {allowHide: false, }, handleUsersConnection: handleGuessesConnection,
                                                                 handleUsersDisconnection: handleGuessesDisconnection, handleUserMessage: handleGuessMessage, connect: true})

    return (
        <Container>
            {chatView}
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  background-image: linear-gradient(#00008B,#0000FF)
  `