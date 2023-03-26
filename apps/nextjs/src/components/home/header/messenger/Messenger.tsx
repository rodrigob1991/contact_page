import styled from "@emotion/styled"
import {maxWidthSmallestLayout} from "../../../../dimensions"
import LiveChat from "../../../chat/LiveChat"
import SendEmail from "./email/SendEmail"

type Props = {
}
export default function Messenger() {
    return (
        <Container>
            <LiveChat/>
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