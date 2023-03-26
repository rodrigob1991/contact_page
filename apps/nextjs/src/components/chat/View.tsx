import styled from "@emotion/styled"
import {useEffect, useRef, useState} from "react"
import {TextInput} from "../FormComponents"
import {isEmpty} from "utils/src/strings"

export type MessageData = { user: string, number: number, body: string, ack: boolean }
export type Position = { left: number, top: number }

type Props = {
    messages: MessageData[]
    users: string[]
    position: Position
    sendMessage: (body: string) => void
}

const LOCAL_USER = "me"

export default function ChatView({messages, users, position, sendMessage}: Props) {
    const userColorMapRef = useRef(new Map<string, string>([[LOCAL_USER, "black"]]))
    const getUserColorMap = () => userColorMapRef.current

    const getNewColor = () => {
        const r = Math.floor((Math.random() * 127) + 127)
        const g = Math.floor((Math.random() * 127) + 127)
        const b = Math.floor((Math.random() * 127) + 127)

        const rgb = (r << 16) + (g << 8) + b
        return `#${rgb.toString(16)}`
    }
    const getUserColor = (user: string) => {
        let color = getUserColorMap().get(user)
        if (!color) {
            color = getNewColor()
            getUserColorMap().set(user, color)
        }
        return color
    }

    const [messageStr, setMessageStr] = useState("")
    const handleInputMessage = () => {
        if (!isEmpty(messageStr)) {
            sendMessage(messageStr)
            setMessageStr("")
        }
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    return (
        <Container {...position}>
            <UsersContainer>
                {users.map((u) => <UserView key={u} color={getUserColor(u)}> {u} </UserView>)}
            </UsersContainer>
            <RightContainer>
                <MessagesContainer>
                    {messages.map(({user, number, body, ack}) =>
                             <MessageView key={number} color={getUserColor(user)} ack={ack}> {user + ": " + body} </MessageView>
                    )}
                    <div ref={messagesEndRef}/>
                </MessagesContainer>
                <TextInput  value={messageStr} setValue={setMessageStr} width={1100} onEnter={handleInputMessage}/>
            </RightContainer>
        </Container>
    )
}

const Container = styled.form<{ top: number, left: number}>`
  display: flex;
  ${({top, left}) => 
    "top: " + top + "%;"
    + "left: " + left + "%;"}
  flex-direction: column;
  align-items: center;
  z-index: 1; 
  position: fixed;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 15px;
  gap: 15px;
  overflow: auto; 
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
 `
const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const UsersContainer = styled.div`
  width: 100px;
  height: 500px;
  display: flex;
  overflow-y: auto;
  flex-direction: column;
  padding: 20px;
  background-color: #FFFFFF;
  border-style: solid;
  gap: 10px;
  `
const UserView = styled.label`
 font-size: 20px;
 font-weight: bold;
 color: ${props => props.color};
 `
const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-style: solid;
  border-color: 
  padding: 10px;
  overflow-y: auto;
  gap: 15px;
  height: 500px;
  width: 1100px;
  background-color: #696969;
  `
const MessageView = styled.label<{ ack: boolean }>`
 font-size: 19px;
 font-weight: bold;
 opacity: ${props => props.ack ? 1 : 0.2};
 color: ${props => props.color};
 `
