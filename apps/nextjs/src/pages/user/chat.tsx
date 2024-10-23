import styled from "@emotion/styled"
import useChat, { UserMessageHandler, UsersConnectionHandler, UsersDisconnectionHandler } from "../../hooks/with_jsx/chat/useChat"
import { ConnectingHandler, ConnectedHandler, DisconnectedHandler } from "../../hooks/chat/useWebSocket"

type Props = {}

export default function HostLiveChat({}: Props) {
    const guessesConnectionHandler: UsersConnectionHandler = (guessesName) => {
    }
    const guessesDisconnectionHandler: UsersDisconnectionHandler = (guessesName) => {
    }
    const guessMessageHandler: UserMessageHandler = (guessName, messageBody) => {
    }

    const connectingHandler: ConnectingHandler = () => {
    }
    const connectedHandler: ConnectedHandler = () => {
    }
    const disconnectedHandler: DisconnectedHandler = () => {
    }

    const {connectionState, setChatModalVisible, chatModal} = useChat({userType: "host", connectingHandler, connectedHandler, disconnectedHandler, viewProps: {allowHide: false, }, usersConnectionHandler: guessesConnectionHandler,
                                                                 usersDisconnectionHandler: guessesDisconnectionHandler, userMessageHandler: guessMessageHandler, connect: true})

    return <Container>
           {chatModal}
           </Container>
    
}
const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  background-image: linear-gradient(#00008B,#0000FF)
  `