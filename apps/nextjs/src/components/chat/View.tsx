import styled from "@emotion/styled"
import {useEffect, useRef, useState} from "react"
import {TextInput} from "../FormComponents"
import {isEmpty} from "utils/src/strings"
import {LOCAL_USER} from "./LiveChat"
import {UserType} from "chat-common/src/model/types"

export type MessageData = { fromUserId: string, toUsersIds: string[], number: number, body: string, ack: boolean }
export type ContainerProps = {show: boolean, left: number, top: number }
type GuessesIds<UT extends UserType> = UT extends "host" ? string[] : undefined
type SendMessage<UT extends UserType> =  (b: string, gi: GuessesIds<UT>) => void

type Props<UT extends UserType> = {
    userType: UT
    messages: MessageData[]
    usersIds: string[]
    sendMessage: SendMessage<UT>
    containerProps: ContainerProps
}

export default function ChatView<UT extends UserType>({userType, messages, usersIds, containerProps, sendMessage}: Props<UT>) {
    const isHost = userType === "host"
    const [selectedGuessesIds, setSelectedGuessesIds] = useState<string[]>([])

    const userColorMapRef = useRef(new Map<string, string>([[LOCAL_USER, "black"]]))
    const getUserColorMap = () => userColorMapRef.current

    const getNewColor = () => {
        const r = Math.floor((Math.random() * 127) + 127)
        const g = Math.floor((Math.random() * 127) + 127)
        const b = Math.floor((Math.random() * 127) + 127)

        const rgb = (r << 16) + (g << 8) + b
        return `#${rgb.toString(16)}`
    }
    const getUserColor = (id: string) => {
        let color = getUserColorMap().get(id)
        if (!color) {
            color = getNewColor()
            getUserColorMap().set(id, color)
        }
        return color
    }

    const handleClickUser = (e: React.MouseEvent<HTMLSpanElement>, id: string) => {
        if (isHost) {
            if (selectedGuessesIds.includes(id)) {
                setSelectedGuessesIds((sgis) => {
                    const updatedSelectedGuessesIds = [...sgis]
                    updatedSelectedGuessesIds.splice(sgis.findIndex(sgi => sgi === id), 1)
                    return updatedSelectedGuessesIds
                })
            } else {
                setSelectedGuessesIds([...selectedGuessesIds, id])
            }
        }
    }

    const [messageStr, setMessageStr] = useState("")

    const handleInputMessage = () => {
        if (!isEmpty(messageStr)) {
            sendMessage(messageStr, (isHost ? selectedGuessesIds : undefined) as GuessesIds<UT>)
            setMessageStr("")
        }
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    return (
        <Container {...containerProps}>
            <UsersContainer>
                {usersIds.map((ui) => <UserView key={ui} color={getUserColor(ui)} onClick={(e) => { handleClickUser(e, ui)}}> {ui} </UserView>)}
            </UsersContainer>
            <RightContainer>
                <MessagesContainer>
                    {messages.map(({fromUserId, toUsersIds, number, body, ack}) =>
                             <MessageView key={fromUserId + "-" + number} color={getUserColor(fromUserId)} ack={ack}> {`${fromUserId}${isHost ? "-> " + toUsersIds.toString() : ""} : ${body}`} </MessageView>
                    )}
                    <div ref={messagesEndRef}/>
                </MessagesContainer>
                <TextInput value={messageStr} setValue={setMessageStr} width={1100} onEnter={handleInputMessage}/>
            </RightContainer>
        </Container>
    )
}

const Container = styled.form<ContainerProps>`
  ${({show, top, left}) =>
    "display: " + (show ? "flex" :  "none") + ";"
    + "top: " + top + "%;"
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
const UserView = styled.span`
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
