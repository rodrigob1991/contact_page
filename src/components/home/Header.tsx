import Link from "next/link"
import Image from "next/image"
import styled from "@emotion/styled"

export default function Header() {
    return (
        <Container>
            <ContactLinksContainer>
                <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                    <Image className={"headerIcon"} alt={""} src="/linkedin.svg" width="40" height="40"
                           style={{cursor: "pointer", maxWidth: "100%", height: "auto"}}/>
                </Link>
                <Link href={"https://github.com/rodrigob1991"}>
                    <Image className={"headerIcon"} alt={""} src="/github.svg" width="40" height="40"
                           style={{cursor: "pointer", maxWidth: "100%", height: "auto"}}/>
                </Link>
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
  border-color: white;
  background-color: #778899;
  @media (max-width: 768px) {
    height: 70px;
    min-height: 70px; 
    max-height: 70px;
  }
    `
const ContactLinksContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding-left: 20px;
  width: 100%;
    `