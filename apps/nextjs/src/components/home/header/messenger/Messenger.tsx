import styled from "@emotion/styled"
import {maxWidthSmallestLayout} from "../../../../dimensions"
import SendEmail from "./email/SendEmail"
import GuessLiveChat from "./chat/GuessLiveChat"

type Props = {
    userName: string
}
export default function Messenger({userName}: Props) {
    return (
        <Container>
            <GuessLiveChat hostName={userName.substring(0,(()=> { const endIndex = userName.indexOf(" "); return endIndex < 0 ? userName.length : endIndex })())}/>
            <SendEmail/>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: center;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `