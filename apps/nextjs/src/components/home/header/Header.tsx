import Link from "next/link"
import Image from "next/image"
import styled from "@emotion/styled"
import Messenger from "./messenger/Messenger"
import {maxWidthSmallestLayout} from "../../../dimensions"
import {mainColor, secondColor} from "../../../colors";

type Props = {
    userName: string
}

export default function Header({userName}: Props) {
    return (
        <Container>
            <ContactLinksContainer>
                <Link href={"https://github.com/rodrigob1991"}>
                    <ContactImage data={"/github.svg"}/>
                </Link>
                <Separator/>
                <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                    <ContactImage data={"/linkedin.svg"}/>
                </Link>
                <Separator/>
            </ContactLinksContainer>
            <Messenger userName={userName}/>
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 90px;
  min-height: 90px; 
  max-height: 90px;
  border-bottom: 2px solid;
  border-left: 2px solid;
  border-right: 2px solid;
  border-color: white;
  background-image: linear-gradient( ${mainColor}, ${secondColor});
  z-index: 7;
  @media (max-width: 768px) {
    height: 60px;
    min-height: 60px; 
    max-height: 60px;
  }
    `
const ContactLinksContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  margin-left: 10px;
  width: 100%;
  height: 100%;
  align-items: center;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `
const ContactImage = styled.object`
  pointer-events: none;
  width: 50px;
  height: 50px;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 30px;
    height: 30px;
  }
`
export const Separator = styled.div`
  width: 2px;
  height: 100%;
  background-color: white;
`