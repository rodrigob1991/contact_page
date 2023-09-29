import LiveChat, {
    HandleUserMessage,
    HandleUsersConnection, HandleUsersDisconnection
} from "../../components/chat/LiveChat"
import styled from "@emotion/styled"
import {HandleNewConnectionState} from "../../hooks/useWebSocket"

type Props = {}

export default function HostLiveChat({}: Props) {
    const handleGuessesConnection: HandleUsersConnection = (guessesName) => {
    }
    const handleGuessesDisconnection: HandleUsersDisconnection = (guessesName) => {
    }
    const handleGuessMessage: HandleUserMessage = (guessName, messageBody) => {
    }

    const handleNewConnectionState: HandleNewConnectionState = (cs) => {}

    return (
        <Container>
        <LiveChat userType={"host"} nextHandleNewConnectionState={handleNewConnectionState} viewProps={{containerProps: {show: true, top: 50, left: 50}}}
                  handleUsersConnection={handleGuessesConnection} handleUsersDisconnection={handleGuessesDisconnection} handleUserMessage={handleGuessMessage} connect={true}
                  />
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  background-image: linear-gradient(#00008B,#0000FF);
  `