import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { UserType } from "chat-common/src/model/types"
import React, { useEffect, useRef, useState } from "react"
import { BsEyeSlashFill, BsFillEnvelopeFill, BsFillEnvelopeOpenFill, BsFillEnvelopeXFill } from "react-icons/bs"
import { FiArrowRight } from "react-icons/fi"
import { MdCenterFocusWeak } from "react-icons/md"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { isEmpty } from "utils/src/strings"
import { mainColor, secondColor } from "../../colors"
import { InboundMessageData, MessagesData, OutboundMessageData, UserAckState } from "./useMessages"
import { GetUserColor, LOCAL_USER_ID, SelectOrUnselectUser, Users } from "./useUsers"
import { ConnectionState } from "./useWebSocket"
import { maxWidthSmallestLayout } from "../../layouts"
import { TextInput } from "../../components/FormComponents"
import { GetStyle, PositionCSS, ResizableDraggableDiv, SizeCSS, setAvoidProperty } from "../../components/ResizableDraggableDiv"

export type SetOutboundMessageData =  (body: string) => boolean
export type ContainerProps = { show: boolean, left: number, top: number, viewPortPercentage?: number}
export type Hide = () => void

type Props<UT extends UserType> = {
    userType: UT
    connectionState: ConnectionState
    messages: MessagesData
    users: Users
    selectOrUnselectUser: SelectOrUnselectUser
    getUserColor: GetUserColor
    setOutboundMessageData: SetOutboundMessageData
    position?: PositionCSS
    size?: SizeCSS
    allowHide: boolean
}

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

export default function useView<UT extends UserType>({userType, connectionState, messages, users, selectOrUnselectUser, getUserColor, setOutboundMessageData, position=centerPosition, size=fullSize, allowHide}: Props<UT>): [(visible: boolean) => void, JSX.Element] {
    const isHost = userType === "host"

    const [visible, setVisible] = useState(false)

    const [messageBody, setMessageBody] = useState("")

    const [handleClickUser, getOutboundMessageView] = (isHost ? getHostSpecifics(selectOrUnselectUser) : getGuessSpecifics(selectOrUnselectUser)) as GetUserSpecificsReturn<UT>

    const handleInputMessage = () => {
        if (!isEmpty(messageBody)) {
            if (setOutboundMessageData(messageBody)) {
                setMessageBody("")
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
    
    const [ultimateSize, setUltimateSize] = useState(size)
    const [ultimatePosition, setUltimatePosition] = useState(position)

    const getContainerStyle: GetStyle = (resizing, dragging) => css`
      display: ${visible ? "flex" :  "none"}; position: fixed; top: 50%; left: 50%;
      min-height: 350px; min-width: 350px; max-height: 100%; max-width: 100%;
      transform: translate(-50%, -50%);
    `
    const getResizableDivStyle: GetStyle = (resizing, dragging) => css`
      height: 100%; width: 100%; padding: 10px; background-color: ${secondColor}; border: solid 4px ${mainColor}; border-radius: 10px; background-color: ${secondColor};
    `
    const getDraggableDivStyle: GetStyle =  (resizing, dragging) => css` 
      display: flex; flex-direction: column; height: 100%; width: 100%;
    `
    const topIconsCommonProps = {size: 30, css: css`cursor: pointer; color: ${secondColor}`}

    const view = 
        <ResizableDraggableDiv draggable resizable getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} ultimateSize={ultimateSize} ultimatePosition={ultimatePosition}>
            <TopContainer> 
              <MdCenterFocusWeak {...topIconsCommonProps} onClick={(e) => {setUltimatePosition(centerPosition)}}/>
              <SlSizeActual  {...topIconsCommonProps} onClick={(e) => {setUltimateSize(size)}}/>
              <SlSizeFullscreen  {...topIconsCommonProps} onClick={(e) => {setUltimateSize(fullSize)}}/>
              {allowHide && <BsEyeSlashFill {...topIconsCommonProps} onClick={(e)=> {setVisible(false)}}/>}
              <TopRightInnerContainer>
                <ConnectionStateView connectionState={connectionState}/>
              </TopRightInnerContainer> 
            </TopContainer>
            <BottomContainer>
              <UsersContainer>
                {users.map(({id, name, isConnected, selected}, index) => <UserView key={id} color={getUserColor(id)} onClick={ handleClickUser ? (e) => { handleClickUser(e, index)} : undefined} isHost={isHost} isSelected={isHost && selected} isConnected={isConnected}>{name}</UserView>)}
              </UsersContainer>
              <BottomRightContainer>
              <MessagesContainer>
                {messages.map((md) => md.flow === "in" ? getInboundMessageView(md) : getOutboundMessageView(md, getUserColor))}
                <div ref={messagesEndRef}/>
              </MessagesContainer>
              <InputMessageContainer>
                <TextInput css={css`border-color: ${mainColor};`} fromSpan value={messageBody} setValue={setMessageBody} onEnter={handleInputMessage} placeholder={"type message..."} onMouseDown={e => {setAvoidProperty(e, true, true)}}/>
                <FiArrowRight color={"white"} size={"35px"} cursor={"pointer"} onClick={handleInputMessage}/>
              </InputMessageContainer>
              </BottomRightContainer>
            </BottomContainer>
        </ResizableDraggableDiv>

    return [setVisible, view]
}

type HandleClickUser<UT extends UserType> = UT extends "host" ? (e: React.MouseEvent<HTMLSpanElement>, index: number) => void : undefined
type GetOutboundMessageView = (omd: OutboundMessageData, getUserColor: (u: number) => string) => JSX.Element
type GetUserSpecificsReturn<UT extends UserType> = [HandleClickUser<UT>, GetOutboundMessageView]
type GetUserSpecifics<UT extends UserType> = (selectOrUnselectUser: SelectOrUnselectUser) => GetUserSpecificsReturn<UT>

const getHostSpecifics: GetUserSpecifics<"host"> = (selectOrUnselectUser) => {
    const handleClickGuess: HandleClickUser<"host"> = (e, index) => {
        selectOrUnselectUser(index)
    }
    const getOutboundMessageView : GetOutboundMessageView = ({number, body, toUsersIds, serverAck}, getUserColor) => {
        const hostColor = getUserColor(LOCAL_USER_ID)

        const toGuessesIdsViews: JSX.Element[] = []
        toUsersIds.forEach((userAck, userId) => {
            toGuessesIdsViews.push(<ToGuessIdView key={userId} userAck={userAck} color={ getUserColor(userId)}> {userId} </ToGuessIdView>)
        })
        return <MessageView key={LOCAL_USER_ID + "-" + number} isOutbound={true}>
               {toGuessesIdsViews}
               <MessageBody color={hostColor} serverAck={serverAck}> {body} </MessageBody>
               </MessageView>
    }

    return [handleClickGuess, getOutboundMessageView]
}
const getGuessSpecifics: GetUserSpecifics<"guess"> = () => {
    const iconAckStyle = css`min-width: 15px; min-height: 15px; margin-top: 5px; margin-right: 2px; color:${secondColor};`
    const getOutboundMessageView: GetOutboundMessageView = ({number, body, toUsersIds, serverAck}, getUserColor) => {
        const hostAckState = toUsersIds.values().next().value
        return <MessageView key={LOCAL_USER_ID + "-" + number} isOutbound={true}>
            {hostAckState === "pen" ? <BsFillEnvelopeFill css={iconAckStyle}/> : hostAckState === "ack" ?
                <BsFillEnvelopeOpenFill css={iconAckStyle}/> : <BsFillEnvelopeXFill css={iconAckStyle}/>}
            <MessageBody color={getUserColor(LOCAL_USER_ID)} serverAck={serverAck}>{body} </MessageBody>
        </MessageView>
    }
    return [undefined, getOutboundMessageView]
}

const BottomContainer = styled.div`
  display: flex;
  flex-direction: row;
  overflow: auto;
  gap: 5px;
  width: 100%;
  height: 100%;
`
const TopContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  height: 40px;
  width: 100%;
  border-style: solid;
  border-radius: 10px;
  border-color: ${mainColor};
  background-color: #DCDCDC;
  justify-content: center;
  align-items: center;
  margin-bottom: 5px;
`
const TopRightInnerContainer = styled.div`
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
  border-color: ${secondColor};
  display: inline-block;
  background-color: ${({connectionState: cs})=> cs === ConnectionState.DISCONNECTED ? "red" : cs === ConnectionState.CONNECTING ? "yellow" : "green" } ;
`
const UsersContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-style: solid;
  border-radius: 10px;
  padding: 5px;
  background-color: #DCDCDC;
  border-style: solid;
  border-color: ${mainColor};
  margin-bottom: 0px;
  gap: 5px;
  height: 100%;
  min-width: 120px;
  overflow: auto;
  `
const UserView = styled.div<{ isHost: boolean, isConnected: boolean, isSelected: boolean }>`
 font-size: 23px;
 font-weight: bold;
 text-align: center;
 overflow: visible;
 background-color: #FFFFFF;
 border-radius: 15px;
 border-style: solid;
 padding: 5px;
 min-width: 100%;
 width: max-content;
 ${({color, isHost, isConnected, isSelected}) =>
    "color: " + color + ";"
    + (isHost ? "cursor: pointer;" : "")
    +  "opacity:" + (isConnected ? 1 : 0.2) + ";"
    + (isSelected ? "background-color: green;" : "")
}
@media (max-width: ${maxWidthSmallestLayout}px) {
    font-size: 17px;
    padding: 2px;
    border-radius: 10px;
  }
 `
const BottomRightContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 5px;
  overflow: auto;
`
const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-style: solid;
  border-radius: 10px;
  border-color: ${mainColor};
  padding: 5px;
  gap: 5px;
  background-color: white;
  overflow: auto;
  scrollbar-color: green;
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
const InputMessageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  width: 100%;
`