import styled from "@emotion/styled"
import useChat, {
    HandleUserMessage,
    HandleUsersConnection, HandleUsersDisconnection
} from "../../hooks/chat/useChat"
import { HandleNewConnectionState } from "../../hooks/chat/useWebSocket"

type Props = {}

export default function HostLiveChat({}: Props) {
    const handleGuessesConnection: HandleUsersConnection = (guessesName) => {
    }
    const handleGuessesDisconnection: HandleUsersDisconnection = (guessesName) => {
    }
    const handleGuessMessage: HandleUserMessage = (guessName, messageBody) => {
    }

    const handleNewConnectionState: HandleNewConnectionState = (cs) => {}

    const [setChatVisible, chatView] = useChat({userType: "host", nextHandleNewConnectionState: handleNewConnectionState, viewProps: {allowHide: false}, handleUsersConnection: handleGuessesConnection,
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
  background-image: linear-gradient(#00008B,#0000FF);
  `