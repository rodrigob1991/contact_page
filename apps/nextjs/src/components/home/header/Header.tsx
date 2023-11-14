import Link from "next/link"
import styled from "@emotion/styled"
import Messenger from "./messenger/Messenger"
import {maxWidthSmallestLayout} from "../../../layouts"
import {mainColor, secondColor} from "../../../colors"
import Image from "next/image"

type Props = {
}

export default function Header({}: Props) {
    return (
        <Container>
          <Messenger/>
            <ContactLinksContainer>
                <Link href={"https://github.com/rodrigob1991"}>
                    <ContactImage data={"/github.svg"}/>
                </Link>
                <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                    <ContactImage data={"/linkedin.svg"}/>
                </Link>
            </ContactLinksContainer>
            <Logo alt={"uruguay"} src={"/favicon.png"} width={80} height={80}/>
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 90px;
  min-height: 90px; 
  max-height: 90px;
  border-bottom: 2px solid;
  border-color: ${mainColor};
  padding: 20px;
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
  margin-left: auto;
  height: 100%;
  align-items: center;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `

export const Separator = styled.div`
  width: 2px;
  height: 100%;
  background-color: ${mainColor};
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
const Logo = styled(Image)`
  width: 70px;
  height: 70px;
  margin-left: auto;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 50px;
    height: 50px;
  }
`