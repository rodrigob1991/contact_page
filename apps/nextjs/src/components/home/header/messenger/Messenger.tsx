import styled from "@emotion/styled"
import {maxWidthSmallestLayout} from "../../../../dimensions"
import SendEmail from "./email/SendEmail"
import GuessChat from "./chat/GuessChat"
import {Separator} from "../Header"

type Props = {}
export default function Messenger({}: Props) {
    return (
        <Container>
            <Separator/>
            <GuessChat/>
            <Separator/>
            <SendEmail/>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  gap: 20px;
  margin-right: 10px;
  align-items: center;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `