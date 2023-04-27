import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {TextInput} from "../FormComponents"
import {isEmpty} from "utils/src/strings"
import {HOST_ID, InboundMessageData, LOCAL_USER_ID, MessageData, OutboundMessageData, UserAckState} from "./LiveChat"
import {UserType} from "chat-common/src/model/types"
import {BsEyeSlashFill, BsFillEnvelopeFill, BsFillEnvelopeOpenFill, BsFillEnvelopeXFill} from "react-icons/bs"
import {FiArrowRight} from "react-icons/fi"
import {ConnectionState} from "../../hooks/useWebSocket"
import {maxWidthSmallestLayout, minWidthFullLayout} from "../../dimensions"

type ToGuessesIds<UT extends UserType> = UT extends "host" ? string[] : undefined
export type SendOutboundMessage<UT extends UserType> =  (body: string, to: ToGuessesIds<UT>) => void
export type ContainerProps = { show: boolean, left: number, top: number }
export type Hide = () => void

type Props<UT extends UserType> = {
    userType: UT
    connectionState: ConnectionState
    messages: MessageData[]
    connectedUsersIds: string[]
    sendOutboundMessage: SendOutboundMessage<UT>
    containerProps: ContainerProps
    hide?: Hide
}

export default function ChatView<UT extends UserType>({userType, connectionState, messages, connectedUsersIds, sendOutboundMessage, containerProps, hide}: Props<UT>) {
    const [bodyMessageStr, setBodyMessageStr] = useState("")

    const [selectedConnectedUsersIds, setSelectedConnectedUsersIds] = useState<string[]>([])
    const addOrRemoveSelectedConnectedUserId = (id: string) => {
        if (selectedConnectedUsersIds.includes(id)) {
            setSelectedConnectedUsersIds((sgis) => {
                const updatedSelectedGuessesIds = [...sgis]
                updatedSelectedGuessesIds.splice(sgis.findIndex(sgi => sgi === id), 1)
                return updatedSelectedGuessesIds
            })
        } else {
            setSelectedConnectedUsersIds([...selectedConnectedUsersIds, id])
        }
    }

    const userColorMapRef = useRef(new Map<string, string>([[LOCAL_USER_ID, "black"]]))
    const getUserColorMap = () => userColorMapRef.current
    const getUserColor = (id: string) => {
        let color = getUserColorMap().get(id)
        if (!color) {
            color = getNewColor()
            getUserColorMap().set(id, color)
        }
        return color
    }

    const isHost = userType === "host"

    const [handleClickUser, getOutboundMessageView, sendOutboundMessageAccordingUser] = (isHost ? getHostSpecifics(selectedConnectedUsersIds, addOrRemoveSelectedConnectedUserId) : getGuessSpecifics(selectedConnectedUsersIds, addOrRemoveSelectedConnectedUserId)) as GetUserSpecificsReturn<UT>

    const handleInputMessage = () => {
        if (!isEmpty(bodyMessageStr)) {
            if (sendOutboundMessageAccordingUser(bodyMessageStr, sendOutboundMessage)) {
                setBodyMessageStr("")
            }
        }
    }
    const getInboundMessageView = ({fromUserId, number, body}: InboundMessageData) =>
        <MessageView key={fromUserId + "-" + number} isOutbound={false}>
        <MessageBody serverAck={true} color={getUserColor(fromUserId)}> {body} </MessageBody>
        </MessageView>

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
                {connectedUsersIds.map((ui) => <UserView key={ui} color={getUserColor(ui)} onClick={ handleClickUser ? (e) => { handleClickUser(e, ui)} : undefined} isHost={isHost} isSelected={isHost && selectedConnectedUsersIds.includes(ui)}> {ui} </UserView>)}
                </UsersInnerContainer>
            </UsersContainer>
            <RightContainer>
                <MessagesContainer>
                    {messages.map((md) => md.flow === "in" ? getInboundMessageView(md) : getOutboundMessageView(md, getUserColor))}
                    <div ref={messagesEndRef}/>
                </MessagesContainer>
                <SendMessageContainer>
                <TextInputStyled value={bodyMessageStr} setValue={setBodyMessageStr} onEnter={handleInputMessage} placeholder={"type message..."}/>
                    <FiArrowRight color={"white"} size={"35px"} cursor={"pointer"} onClick={handleInputMessage}/>
                </SendMessageContainer>
            </RightContainer>
            </InnerContainer>
        </Container>
    )
}

const getNewColor = () => {
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

type SendOutboundMessageAccordingUser<UT extends UserType> = (b: string, sendOutboundMessage: SendOutboundMessage<UT>) => boolean
type HandleClickUser<UT extends UserType> = UT extends "host" ? (e: React.MouseEvent<HTMLSpanElement>, id: string) => void : undefined
type GetOutboundMessageView = (omd: OutboundMessageData, getUserColor: (u: string) => string) => JSX.Element
type GetUserSpecificsReturn<UT extends UserType> = [HandleClickUser<UT>, GetOutboundMessageView, SendOutboundMessageAccordingUser<UT>]
type GetUserSpecifics<UT extends UserType> = (selectedConnectedUsersIds: string[], addOrRemoveSelectedConnectedUserId: (id: string) => void) => GetUserSpecificsReturn<UT>

const getHostSpecifics: GetUserSpecifics<"host"> = (selectedConnectedGuessesIds, addOrRemoveSelectedConnectedGuessId) => {
    const handleClickGuess: HandleClickUser<"host"> = (e: React.MouseEvent<HTMLSpanElement>, id: string) => {
        addOrRemoveSelectedConnectedGuessId(id)
    }
    const getOutboundMessageView : GetOutboundMessageView = ({number, body, toUsersIds, serverAck}, getUserColor) => {
        const hostColor = getUserColor(LOCAL_USER_ID)

        const toGuessesIdsViews: JSX.Element[] = []
        toUsersIds.forEach((userAck, userId) => {
            toGuessesIdsViews.push(<ToGuessIdView key={userId} userAck={userAck} color={ getUserColor(userId.toString())}> {userId} </ToGuessIdView>)
        })
        return <MessageView key={LOCAL_USER_ID + "-" + number} isOutbound={true}>
               {toGuessesIdsViews}
               <MessageBody color={hostColor} serverAck={serverAck}> {body} </MessageBody>
               </MessageView>
    }

    const sendOutboundMessageAccordingUser: SendOutboundMessageAccordingUser<"host"> = (b, sendOutboundMessage) => {
        const send = selectedConnectedGuessesIds.length > 0
        if (send) {
            sendOutboundMessage(b, selectedConnectedGuessesIds)
        }
        return send
    }

    return [handleClickGuess, getOutboundMessageView, sendOutboundMessageAccordingUser]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const iconStyleProps = {style: {minWidth: "15px", minHeight: "15px", marginTop: "5px", marginRight: "2px"}}
    const getOutboundMessageView: GetOutboundMessageView = ({number, body, toUsersIds, serverAck}, getUserColor) => {
        const hostAckState = toUsersIds.get(HOST_ID)
       return <MessageView key={LOCAL_USER_ID + "-" + number} isOutbound={true}>
                {hostAckState === "pen" ? <BsFillEnvelopeFill {...iconStyleProps}/> : hostAckState === "ack" ? <BsFillEnvelopeOpenFill {...iconStyleProps}/> : <BsFillEnvelopeXFill {...iconStyleProps}/>}
                <MessageBody color={getUserColor(LOCAL_USER_ID)} serverAck={serverAck}>{body} </MessageBody>
             </MessageView>
    }

    const sendOutboundMessageAccordingUser: SendOutboundMessageAccordingUser<"guess"> = (b, sendOutboundMessage) => {
        sendOutboundMessage(b, undefined)
        return true
    }
    return [undefined, getOutboundMessageView, sendOutboundMessageAccordingUser]
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
  height: 25px;
  width: 25px;
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
  padding: 5px;
  gap: 5px;
  overflow-y: auto;
  background-color: #DCDCDC;
`
const MessageView = styled.div<{ isOutbound: boolean}>`
 ${({isOutbound}) =>
    "align-self:" +  (isOutbound ? "flex-start" : "flex-end") + ";"
    + "margin-" + (isOutbound ? "right" : "left") + ": 40px;"}
 display: flex;
 width: fit-content;
 height: fit-content;
 flex-shrink: 0;
 font-weight: bold;
 overflow: hidden;
 `
const MessageBody = styled.div<{ serverAck: boolean}>`
 ${({color, serverAck}) => 
    "opacity:" + (serverAck ? 1 : 0.2) + ";"
    + ("color:" +  color + ";")}
 background-color: #FFFFFF;
 border-radius: 15px;
 border-style: solid;
 padding: 3px;
 font-size: 23px;
 @media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 19px;
  }
`
const ToGuessIdView = styled.span<{ userAck: UserAckState }>`
   ${({userAck, color}) =>
    "color: " + color + ";"
    + "border-style: " +  (userAck === "pen" ? "dashed" : userAck === "ack" ?  "solid" : "dotted") + ";"}
    background-color: #FFFFFF;
    border-radius: 15px;
    height: fit-content;
    font-size: 20px;
    padding: 1px;
    @media (max-width: ${maxWidthSmallestLayout}px) {
        font-size: 17px;
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