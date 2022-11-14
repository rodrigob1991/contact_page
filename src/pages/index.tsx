import styled from "@emotion/styled"
import {PropsStorageClient} from "../classes/PropsStorageClient"
import {MdForwardToInbox} from "react-icons/md"
import Image from "next/image";
import Link from "next/link"
import {useFormModal} from "../components/FormComponents"
import {HomeProps} from "../types/Home"
import PresentationView from "../components/home/presentation/PresentationView"
import StoriesView from "../components/home/stories/StoriesView"
import {Container, Footer} from "../components/home/Layout"

export const HOME_ROUTE = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getHomeProps()

    if (!props) {
        throw new Error("There is not home props in the database")
    }

    // json parser is use to don`t serialize undefined values, Next.js throw an error otherwise.
    return {props: JSON.parse(JSON.stringify(props))}
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
        const logError = (error: any) => {
            console.error(`Error sending the email: ${JSON.stringify(error)}`)
        }

        return fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
            },
            body: JSON.stringify(bodyParams),
        }).then((response) => {
                let nextThenArg
                if (response.ok) {
                    nextThenArg = "ok"
                } else {
                    nextThenArg = response.json()
                }
                return nextThenArg
            }
        ).then((resultMessageOrBody) => {
            let resultMessage
            if (resultMessageOrBody === "ok") {
                resultMessage = succeedResultMessage
            } else {
                resultMessage = unsucceedResultMessage
                logError(resultMessageOrBody)
            }
            return resultMessage
        }).catch((e) => {
            logError(e)
            return unsucceedResultMessage
        })
    }
    const [showSendMessageModal, SendMessageModal] = useFormModal(
        {
            inputElementsProps: {
                from: {type: "textInputEmail", required: true, placeholder: "from", width: 300, style:{ fontSize: "2rem"}},
                subject: {type: "textInput", placeholder: "subject", width: 300, style:{ fontSize: "2rem"}},
                message: {type: "textAreaInput", required: true, placeholder: "message", height: 250, width: 300, style:{ fontSize: "2rem"}}
            },
            processSubmission : sendEmail,
            position: {left: 50, top: 40},
            resultMessageStyle: {fontStyle: "2rem"},
            button: {text: "SEND EMAIL", style: {fontSize: "1.7rem"}}
        })

  return (
      <Container>
          {SendMessageModal}
          <Header>
              <ContactLinksContainer>
                  <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                      <Image alt={""} src="/linkedin.svg" width="40" height="40"
                          style={{cursor: "pointer", maxWidth: "100%", height: "auto"}} />
                  </Link>
                  <Link href={"https://github.com/rodrigob1991"}>
                      <Image alt={""} src="/github.svg" width="40" height="40"
                          style={{cursor: "pointer", maxWidth: "100%", height: "auto"}} />
                  </Link>
                  <MdForwardToInbox size={70} style={{cursor: "pointer", paddingLeft: 20, paddingTop: 25, color: "#DAA520"}} onClick={(e)=> showSendMessageModal()}/>
              </ContactLinksContainer>
          </Header>
          <PresentationView presentation={presentation || {name:"", introduction: "", skills: [], image: undefined}}/>
          <StoriesView stories={stories}/>
          <Footer>
          </Footer>
      </Container>
  );
}
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