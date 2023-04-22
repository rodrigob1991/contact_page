import LiveChat, {
    FirstHandleConMessage,
    FirstHandleDisMessage,
    FirstHandleMesMessage
} from "../../components/chat/LiveChat"
import styled from "@emotion/styled"
import {HandleNewConnectionState} from "../../hooks/useWebSocket"

type Props = {}

export default function HostLiveChat({}: Props) {

    const handleConMessage: FirstHandleConMessage<"host"> = (cm) => {
        return cm.guessId.toString()
    }
    const handleDisMessage: FirstHandleDisMessage<"host"> = (dm) => {
        return dm.guessId.toString()
    }
    const handleMesMessage: FirstHandleMesMessage<"host"> = (mm) => {
        return mm.guessId.toString()
    }

    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
    }

    return (
        <Container>
        <LiveChat userType={"host"} nextHandleNewConnectionState={handleNewConnectionState} viewProps={{containerProps: {show: true, top: 50, left: 50}}}
                  firstHandleConMessage={handleConMessage} firstHandleDisMessage={handleDisMessage} firstHandleMesMessage={handleMesMessage} connect={true}/>
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
  background-image: linear-gradient(#00008B,#0000FF);
  `