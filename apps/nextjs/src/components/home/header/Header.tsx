import Link from "next/link"
import Image from "next/image"
import styled from "@emotion/styled"
import Messenger from "./messenger/Messenger"
import {maxWidthSmallestLayout} from "../../../dimensions"

export default function Header() {
    return (
        <Container>
            <LogoImage alt={""} src={"/favicon.png"} width={80} height={80}/>
            <ContactLinksContainer>
                <Messenger/>
                <Separator/>
                <Link href={"https://github.com/rodrigob1991"}>
                    <ContactImage data={"/github.svg"}/>
                </Link>
                <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                    <ContactImage data={"/linkedin.svg"}/>
                </Link>
                <Separator/>
            </ContactLinksContainer>
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
  background-color: #778899;
  z-index: 7;
  @media (max-width: 768px) {
    height: 70px;
    min-height: 70px; 
    max-height: 70px;
  }
    `
const ContactLinksContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: 40px;
  align-items: center;
  padding-right: 20px;
  width: 100%;
  height: 100%;
  align-items: center;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `
const LogoImage = styled(Image)`
  margin: 20px;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 50px;
    height: 50px;
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
const Separator = styled.div`
  width: 2px;
  height: 100%;
  background-color: white;
`