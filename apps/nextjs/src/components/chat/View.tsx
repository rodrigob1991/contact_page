import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {TextInput} from "../FormComponents"
import {isEmpty} from "utils/src/strings"
import {LOCAL_USER_ID} from "./LiveChat"
import {UserType} from "chat-common/src/model/types"
import {BsEyeSlashFill} from "react-icons/bs"
import {FiArrowRight} from "react-icons/fi"
import {ConnectionState} from "../../hooks/useWebSocket"
import {maxWidthSmallestLayout, minWidthFullLayout} from "../../dimensions";

export type MessageData = { fromUserId: string, toUsersIds?: string[], number: number, body: string, ack: boolean }
type SendMessage =  (b: string, gi?: string[]) => void
export type ContainerProps = { show: boolean, left: number, top: number }
export type Hide = () => void

type Props<UT extends UserType> = {
    userType: UT
    connectionState: ConnectionState
    messages: MessageData[]
    usersIds: string[]
    sendMessage: SendMessage
    containerProps: ContainerProps
    hide?: Hide
}

export default function ChatView<UT extends UserType>({userType, connectionState, messages, usersIds, sendMessage, containerProps, hide}: Props<UT>) {
    const isHost = userType === "host"
    const [selectedGuessesIds, setSelectedGuessesIds] = useState<string[]>([])

    const userColorMapRef = useRef(new Map<string, string>([[LOCAL_USER_ID, "black"]]))
    const getUserColorMap = () => userColorMapRef.current

    const getNewColor = () => {
        /*const r = Math.floor((Math.random() * 127) + 127)
        const g = Math.floor((Math.random() * 127) + 127)
        const b = 1

        const rgb = (r << 16) + (g << 8) + b
        return `#${rgb.toString(16)}`*/
        let r, g, b, brightness
        do {
            // generate random values for R, G y B
            r = Math.floor(Math.random() * 256)
            g = Math.floor(Math.random() * 256)
            b = Math.floor(Math.random() * 256)

            // calculate the resulted brightness
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        } while (brightness < 0.22)

        const rgb = (r << 16) + (g << 8) + b
        // return the color on RGB format
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
            <ToolBarContainer> { hide && <BsEyeSlashFill size={30} style={{position: "absolute", cursor: "pointer", color: "black"}} onClick={(e)=> { hide() }}/> }<ToolBarRightInnerContainer><ConnectionStateView connectionState={connectionState}/></ToolBarRightInnerContainer> </ToolBarContainer>
            <InnerContainer>
            <UsersContainer>
                <UsersContainerTitle>online users</UsersContainerTitle>
                <hr color={"black"} style={{width:"100%", margin: "0px"}}/>
                <UsersInnerContainer>
                {usersIds.map((ui) => <UserView key={ui} color={getUserColor(ui)} onClick={(e) => { handleClickUser(e, ui)}} isHost={isHost} isSelected={isHost && selectedGuessesIds.includes(ui)}> {ui} </UserView>)}
                </UsersInnerContainer>
            </UsersContainer>
            <RightContainer>
                <MessagesContainer>
                    {messages.map(({fromUserId, toUsersIds, number, body, ack}) =>
                             <MessageView key={fromUserId + "-" + number} color={getUserColor(fromUserId)} ack={ack} isLocal={fromUserId === LOCAL_USER_ID}> {`${isHost && toUsersIds ? toUsersIds.toString() + " -> " : ""}${body}`} </MessageView>)}
                    <div ref={messagesEndRef}/>
                </MessagesContainer>
                <SendMessageContainer>
                <TextInputStyled value={messageStr} setValue={setMessageStr} onEnter={handleInputMessage} placeholder={"type message..."}/>
                    <FiArrowRight color={"white"} size={"35px"} cursor={"pointer"} onClick={(e) => {handleInputMessage()}}/>
                </SendMessageContainer>
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
  z-index: 1; 
  position: absolute;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  border-radius: 10px;
  padding: 10px;
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
  gap: 5px;
 `
const InnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  width: 700px;
  height: 700px;
  @media (max-width: ${minWidthFullLayout}px) {
    width: 500px;
    height: 500px;
  }
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 350px;
    height: 400px;
  }
`
const ToolBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  height: 40px;
  width: 100%;
  border-style: solid;
  border-radius: 10px;
  background-color: #A9A9A9;
  justify-content: center;
  align-items: center;
`
const ToolBarRightInnerContainer = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: auto;
`

const ConnectionStateView = styled.span<{connectionState: ConnectionState}>`
  position: relative;
  height: 30px;
  width: 30px;
  margin: 20px;
  border-style: solid;
  border-radius: 50%;
  display: inline-block;
  background-color: ${({connectionState: cs})=> cs === ConnectionState.DISCONNECTED ? "red" : cs === ConnectionState.CONNECTING ? "yellow" : "green" } ;
`

const UsersContainerTitle = styled.span`
  font-size: 21px;
  font-weight: bold;
  text-align: center;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 17px;
  }
`
const UsersContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-style: solid;
  border-radius: 10px;
  padding: 5px;
  background-color: #A9A9A9;
  border-style: solid;
  margin-bottom: 0px;
  gap: 5px;
  width: 20%;
  `
const UsersInnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  gap: 5px;
  width: 100%;
  `
const UserView = styled.span<{ isHost: boolean, isSelected: boolean }>`
 font-size: 23px;
 font-weight: bold;
 text-align: center;
 background-color: #FFFFFF;
 border-radius: 15px;
 border-style: solid;
 padding: 5px;
 width: 100%;
 overflow: auto;
 ${({color, isHost, isSelected}) =>
    "color: " + color + ";"
    + (isHost ? "cursor: pointer;" : "")
    + (isSelected ? "background-color: green;" : "")
}
@media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 17px;
    padding: 2px;
    border-radius: 10px;
  }
 `
const RightContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 80%;
`
const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-style: solid;
  border-radius: 10px;
  padding: 10px;
  overflow-y: auto;
  background-color: #DCDCDC;
`
const MessageView = styled.label<{ ack: boolean, isLocal: boolean}>`
 display: block;
 width: fit-content;
 height: fit-content;
 flex-shrink: 0;
 font-size: 23px;
 font-weight: bold;
 overflow: hidden;
 background-color: #FFFFFF;
 border-radius: 15px;
 border-style: solid;
 box-shadow: 4px 4px 3px black;
 margin: 5px;
 padding: 5px;
 ${({color, ack, isLocal}) => "opacity:" + (ack ? 1 : 0.2) + ";" 
    + ("color:" +  color + ";")
    + "align-self:" +  (isLocal ? "flex-start" : "flex-end") + ";"
    + "margin-" + (isLocal ? "right" : "left") + ": 40px;"
}
@media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 19px;
  }
 `
const SendMessageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
`
const TextInputStyled = styled(TextInput)`
 font-size: 23px;
 border-style: solid;
 border-width: medium;
 border-color: black;
 border-radius: 10px; 
 font-weight: bold;
 padding: 5px; 
 width: 100%;
 @media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 19px;
  }
`