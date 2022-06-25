import styled from "@emotion/styled"
import {FormEvent, useState} from "react"
import {HomeComponentProps, StoryComponent} from "../types/Home"
import {PropsStorageClient} from "../classes/Props"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"
import {MdForwardToInbox} from "react-icons/md"
import Image from "next/image"
import Link from "next/link"
import {TextAreaInput, TextInput} from "../components/FormComponents"
import {Button} from "../components/Buttons"
import {SucceedOperationMessage} from "../components/Labels"
import Clock from "../components/Clock";

export const HOME_ROUTE = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()

    if (!homeProps) {
        throw new Error("There is not home props in the database")
    }

    return {props: homeProps}
}

export default function Home({presentation, stories}: HomeComponentProps) {
    const [showSendMessageModal, setShowSendMessageModal] = useState(false)
    const [fromEmail, setFromEmail] = useState("")
    const [subjectEmail, setSubjectEmail] = useState("")
    const [messageEmail, setMessageEmail] = useState("")
    const [sendEmailResultMessage, setSendEmailResultMessage] = useState({succeed: false, message: ""})
    const handleSendEmail = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sendEmail()
    }
    const sendEmail = () => {
        const bodyParams = {
            sender: {email: fromEmail},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
            subject: subjectEmail,
            htmlContent: `<!DOCTYPE html>  
                <html> 
                    <body>  
                        ${messageEmail}
                    </body> 
                </html>`
        }

        fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
            },
            body: JSON.stringify(bodyParams),
        }).then((response) => {
                const succeed = response.ok
                const message = succeed ? "email sent" : "email was not sent"
                setSendEmailResultMessage({succeed: succeed, message: message})

                return response.json()
            }
        ).then((body) => {
            console.log(`response body of send email: ${body}`)
        }).catch((e) => {
            setSendEmailResultMessage({succeed: false, message: "could not send the email"})
            console.error(`Error sending the email: ${e}`)
        })
    }

    const [storiesWithState, setStoriesWithState] = useState(stories.map((story) => {
        return {story: story, isOpen: false}
    }))

    const openOrCloseStory = (index: number) => {
        const story = {...storiesWithState[index]}
        story.isOpen = !story.isOpen
        setStoriesWithState((stories) => {
            const updatedStories = [...stories]
            updatedStories.splice(index, 1, story)
            return updatedStories
        })
    }

    const getStoryView = (story: StoryComponent, index: number, isOpen: boolean) => {
        const storyTitle =
            <StoryTitleView onClick={(e => openOrCloseStory(index))}>
                <StoryTitle>{story.title}</StoryTitle>
                {isOpen ? <BsChevronDoubleUp/> : <BsChevronDoubleDown/>}
            </StoryTitleView>
        return (
            <StoryView>{
                isOpen ?
                    <StoryOpenView>
                        {storyTitle}
                        <StoryBody>
                            {story.body}
                        </StoryBody>
                    </StoryOpenView>
                    :
                    storyTitle
            }
            </StoryView>
        )
    }
  return (
      <Container>
          <SendMessageModal onSubmit={handleSendEmail} display={showSendMessageModal}>
              <TextInput placeholder={"from"} value={fromEmail} setValue={setFromEmail} width={300}/>
              <TextInput placeholder={"subject"} value={subjectEmail} setValue={setSubjectEmail} width={300}/>
              <TextAreaInput placeholder={"message"} value={messageEmail} setValue={setMessageEmail} width={300} height={150}/>
              <Button backgroundColor={"#00008B"}>SEND EMAIL</Button>
              <SucceedOperationMessage {...sendEmailResultMessage}/>
          </SendMessageModal>
          <Header>
              <ContactLinksContainer>
                  <Link href={"https://www.linkedin.com/in/rodrigo-benoit-867152150"}>
                      <Image style={{cursor: "pointer"}} src="/linkedin.svg" width="40" height="40"/>
                  </Link>
                  <Link href={"https://github.com/rodrigob1991"}>
                      <Image style={{cursor: "pointer"}} src="/github.svg" width="40" height="40"/>
                  </Link>
                  {/*<Image style={{cursor: "pointer"}} src="/message.png"   width="30px" height="15px" onClick={(e)=> setShowSendMessageModal(!showSendMessageModal)}/>*/}
                  <MdForwardToInbox size={70} style={{cursor: "pointer", paddingLeft: 20, paddingTop: 25}} onClick={(e)=> setShowSendMessageModal(!showSendMessageModal)}/>
              </ContactLinksContainer>
          </Header>
          <PresentationContainer>
              <PresentationNameImageContainer>
               {/*   <Image src="/yo.jpeg" width="100" height="100"/>*/}
                  <PresentationName>
                      {presentation?.name}
                  </PresentationName>
              </PresentationNameImageContainer>
              <PresentationIntroduction>
                  {presentation?.introduction}
              </PresentationIntroduction>
          </PresentationContainer>

        <StoryContainer>
            <StoryContainerTitle>STORIES</StoryContainerTitle>
          {storiesWithState.map(({story, isOpen}, index) => getStoryView(story, index, isOpen))}
        </StoryContainer>
          <Footer>

          </Footer>
      </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
    `
const PresentationName = styled.text`
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.text`
  font-weight: bold;
  font-size: 18px;
  background-color: #778899;
  padding: 7px;
  border-radius: 15px;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationNameImageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 20px;
  background-image: linear-gradient(#00008B,#0000FF);
  align-items: center;
  box-shadow: 5px 10px #888888;
    `
const StoryContainerTitle = styled.text`
  color: #FFFFFF;
  text-decoration-style: solid;
  text-shadow: 2px 2px 5px #000000;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  border-radius: 15px;
  background-color: #778899;
  width: fit-content;
  padding: 5px;
  `
const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 90px;
  gap: 5px;
  background-color: #00008B;
  padding-top: 15px;
  padding-bottom: 15px;
    `
const StoryView = styled.div`
  padding: 15px;
`
const StoryBody = styled.text`
  color: #FFD700;
  font-size: 22px;
  font-weight: bold;
  font-family: "Lucida Console", "Courier New", monospace;
  border-style: solid;
  border-color: #778899;
  padding: 10px;
  border-radius: 5px;
`
const StoryTitleView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  gap: 15px;
  color: #FFFFFF;
  font-size: 25px;
  cursor: pointer;
  width: fit-content;
`
const StoryTitle = styled.text`
  font-size: 25px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  text-shadow: 2px 2px 5px #000000;
`
const StoryOpenView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`
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
const SendMessageModal = styled.form<{display: boolean}>`
  display: ${props => props.display ? "flex" : "none"};
  flex-direction: column;
  align-items: center;
  z-index: 1; 
  position: fixed;
  top: 45%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 15px;
  gap: 15px;
  overflow: auto; 
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
 `

