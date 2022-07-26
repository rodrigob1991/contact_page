import styled from "@emotion/styled"
import {PropsStorageClient} from "../classes/PropsStorageClient"
import {MdForwardToInbox} from "react-icons/md"
import Image from "next/image"
import Link from "next/link"
import {useFormModal} from "../components/FormComponents"
import {HomeProps} from "../types/Home"
import PresentationView from "../components/home/PresentationView"
import StoriesView from "../components/home/StoriesView"
import { Container } from "../components/home/Layout"

export const HOME_ROUTE = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()

    if (!homeProps) {
        throw new Error("There is not home props in the database")
    }

    return {props: homeProps}
}

export default function Home({presentation, stories}: HomeProps) {
    const sendEmail = ({
                           from,
                           subject,
                           message
                       }: {
        from: string,
        subject: string,
        message: string
    }) => {
        const bodyParams = {
            sender: {email: from},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
            subject: subject,
            htmlContent: `<!DOCTYPE html>  
                <html> 
                    <body>  
                        ${message}
                    </body> 
                </html>`
        }
        const succeedResultMessage = {succeed: true, message: "email sent"}
        const unsucceedResultMessage = {succeed: false, message: "email was not sent"}

        return fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
            },
            body: JSON.stringify(bodyParams),
        }).then((response) => {
                return {resultMessage: response.ok ? succeedResultMessage : unsucceedResultMessage, body: response.json()}
            }
        ).then(({resultMessage, body}) => {
            console.log(`response body of send email: ${body}`)
            return resultMessage
        }).catch((e) => {
            console.error(`Error sending the email: ${e}`)
            return unsucceedResultMessage
        })
    }
    const [showSendMessageModal, SendMessageModal] = useFormModal(
        {
            inputElementsProps: {
                from: {type: "textInput", placeholder: "from", height: 50, width: 300},
                subject: {type: "textInput", placeholder: "subject", height: 50, width: 300},
                message: {type: "textAreaInput", placeholder: "message", height: 250, width: 300}
            },
            processSubmission : sendEmail,
            leftPosition: 50,
            topPosition: 40,
            buttonLabel: "SEND EMAIL"
        })

  return (
      <Container>
          {SendMessageModal}
          <Header>
              <ContactLinksContainer>
                  <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                      <Image style={{cursor: "pointer"}} src="/linkedin.svg" width="40" height="40"/>
                  </Link>
                  <Link href={"https://github.com/rodrigob1991"}>
                      <Image style={{cursor: "pointer"}} src="/github.svg" width="40" height="40"/>
                  </Link>
                  <MdForwardToInbox size={70} style={{cursor: "pointer", paddingLeft: 20, paddingTop: 25, color: "#DAA520"}} onClick={(e)=> showSendMessageModal()}/>
              </ContactLinksContainer>
          </Header>
          <PresentationView presentation={presentation || {name:"", introduction: "", image: undefined}}/>
          <StoriesView stories={stories}/>
          <Footer>
          </Footer>
      </Container>
  )
}
const Footer = styled.div`
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(#0000FF, #00008B);
  height: 100%;
    `
const Header = styled.div`
  display: flex;
  flex-direction: row;
  height: 100px;
  min-height: 100px; 
  max-height: 100px;
  border-bottom: 2px solid;
  border-color: #000000;
  background-color: #F5F5F5;
    `
const ContactLinksContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding-left: 50px;
  gap: 30px;
  align-items: left;
    `

