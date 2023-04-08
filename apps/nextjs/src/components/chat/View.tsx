import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {TextInput} from "../FormComponents"
import {isEmpty} from "utils/src/strings"
import {LOCAL_USER_ID} from "./LiveChat"
import {UserType} from "chat-common/src/model/types"
import {IoMdClose} from "react-icons/io"

export type MessageData = { fromUserId: string, toUsersIds?: string[], number: number, body: string, ack: boolean }
type SendMessage =  (b: string, gi?: string[]) => void
export type ContainerProps = { show: boolean, left: number, top: number }
export type Hide = () => void

type Props<UT extends UserType> = {
    userType: UT
    messages: MessageData[]
    usersIds: string[]
    sendMessage: SendMessage
    containerProps: ContainerProps
    hide?: Hide
}

export default function ChatView<UT extends UserType>({userType, messages, usersIds, sendMessage, containerProps, hide}: Props<UT>) {
    const isHost = userType === "host"
    const [selectedGuessesIds, setSelectedGuessesIds] = useState<string[]>([])

    const userColorMapRef = useRef(new Map<string, string>([[LOCAL_USER_ID, "black"]]))
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
            if (isHost && selectedGuessesIds.length > 0) {
                sendMessage(messageStr, selectedGuessesIds)
                setMessageStr("")
            } else if (!isHost) {
                sendMessage(messageStr, undefined)
                setMessageStr("")
            }
        }
    }

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    return (
        <Container {...containerProps}>
            { hide && <IoMdClose size={20} style={{cursor: "pointer", color: "#FFFFFF"}} onClick={(e)=> { hide() }}/> }
            <InnerContainer>
            <UsersContainer>
                {usersIds.map((ui) => <UserView key={ui} color={getUserColor(ui)} onClick={(e) => { handleClickUser(e, ui)}} isHost={isHost} isSelected={isHost && selectedGuessesIds.includes(ui)}> {ui} </UserView>)}
            </UsersContainer>
            <RightContainer>
                <MessagesContainer>
                    {messages.map(({fromUserId, toUsersIds, number, body, ack}) =>
                             <MessageView key={fromUserId + "-" + number} color={getUserColor(fromUserId)} ack={ack}> {`${fromUserId}${isHost && toUsersIds ? " -> " + toUsersIds.toString() : ""} : ${body}`} </MessageView>)}
                    <div ref={messagesEndRef}/>
                </MessagesContainer>
                <TextInput value={messageStr} setValue={setMessageStr} width={600} onEnter={handleInputMessage}/>
            </RightContainer>
            </InnerContainer>
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
  align-self: flex-start;
  z-index: 1; 
  position: fixed;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 15px;
  overflow: auto; 
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
 `
const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
`
const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const UsersContainer = styled.div`
  width: 100px;
  height: fit-content;
  display: flex;
  align-self: flex-start; 
  overflow-y: auto;
  flex-direction: column;
  padding: 10px;
  background-color: #DCDCDC;
  border-style: solid;
  gap: 10px;
  `
const UserView = styled.span<{ isHost: boolean, isSelected: boolean }>`
 font-size: 20px;
 font-weight: bold;
 ${({color, isHost, isSelected}) =>
    "color: " + color + ";"
    + (isHost ? "cursor: pointer;" : "")
    + (isSelected ? "background-color: green;" : "")
}
 `
const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-style: solid;
  border-color: 
  padding: 10px;
  overflow-y: auto;
  height: 500px;
  width: 600px;
  background-color: #DCDCDC;
  `
const MessageView = styled.label<{ ack: boolean }>`
 font-size: 19px;
 font-weight: bold;
 padding: 5px;
 opacity: ${props => props.ack ? 1 : 0.2};
 color: ${props => props.color};
 `
