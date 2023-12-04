import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { UserType } from "chat-common/src/model/types"
import React, { DetailedHTMLProps, HTMLAttributes, MouseEventHandler, useEffect, useRef, useState } from "react"
import { BsEyeSlashFill, BsFillEnvelopeFill, BsFillEnvelopeOpenFill, BsFillEnvelopeXFill } from "react-icons/bs"
import { FiArrowRight } from "react-icons/fi"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"
import { isEmpty } from "utils/src/strings"
import { mainColor, secondColor } from "../../theme"
import { TextInput } from "../../components/FormComponents"
import { GetStyle, PositionCSS, ResizableDraggableDiv, SizeCSS, setPreventFlag } from "../../components/ResizableDraggableDiv"
import { maxWidthSmallestLayout } from "../../layouts"
import { InboundMessageData, MessagesData, OutboundMessageData, UserAckState } from "./useMessages"
import { GetUserColor, LOCAL_USER_ID, SelectOrUnselectUser, Users } from "./useUsers"
import { ConnectionState } from "./useWebSocket"

export type SetOutboundMessageData =  (body: string) => boolean
export type ContainerProps = { show: boolean, left: number, top: number, viewPortPercentage?: number}

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
    handleOnClickHide?: () => void
}

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

export default function useView<UT extends UserType>({userType, connectionState, messages, users, selectOrUnselectUser, getUserColor, setOutboundMessageData, position: positionProp=centerPosition, size: sizeProp=fullSize, allowHide, handleOnClickHide: handleOnClickHideProp}: Props<UT>): [(visible: boolean) => void, JSX.Element] {
    const isHost = userType === "host"
    const [handleClickUser, getOutboundMessageView] = (isHost ? getHostSpecifics(selectOrUnselectUser) : getGuessSpecifics(selectOrUnselectUser)) as GetUserSpecificsReturn<UT>

    const [visible, setVisible] = useState(false)
    const [size, setSize] = useState(sizeProp)
    const [position, setPosition] = useState(positionProp)
    const [messageBody, setMessageBody] = useState("")

    const messagesEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    const handleInputMessage = () => {
      if (!isEmpty(messageBody)) {
          if (setOutboundMessageData(messageBody)) {
              setMessageBody("")
          }
      }
    }
    const handleOnClickCenterPosition: MouseEventHandler<SVGElement> = (e) => {
       setPosition(centerPosition)
    }
    const handleOnClickDefaultSize: MouseEventHandler<SVGElement> = (e) => {
       setSize(sizeProp)
    }
    const handleOnClickFullSize: MouseEventHandler<SVGElement> = (e) => {
       setSize(fullSize)
    }
    const handleOnClickHide: MouseEventHandler<SVGElement> = (e) => {
        setVisible(false)
        if(handleOnClickHideProp)
           handleOnClickHideProp()
    }
    
    const getInboundMessageView = ({fromUserId, number, body}: InboundMessageData) =>
        <MessageView key={fromUserId + "-" + number} isOutbound={false}>
        <MessageBody serverAck={true} color={getUserColor(fromUserId)}> {body} </MessageBody>
        </MessageView>

    const getContainerStyle: GetStyle = (resizing, dragging) => css`
      display: ${visible ? "flex" :  "none"}; position: fixed; 
      min-height: 350px; min-width: 350px; max-height: 100%; max-width: 100%;
      transform: translate(-50%, -50%);
    `
    const getResizableDivStyle: GetStyle = (resizing, dragging) => css`
      height: 100%; width: 100%; padding: 10px; background-color: ${secondColor}; border: solid 4px ${mainColor}; border-radius: 10px; background-color: ${secondColor};
    `
    const getDraggableDivStyle: GetStyle =  (resizing, dragging) => css` 
      display: flex; flex-direction: column; height: 100%; width: 100%;
    `
    const topIconsCommonProps = {size: 28, css: css`cursor: pointer; color: ${secondColor}; padding: 2px;`, onMouseDown: (e: React.MouseEvent) => {setPreventFlag(e, true, true)}}

    const view = 
        <ResizableDraggableDiv draggable resizable getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: position, set: setPosition}}>
            <TopContainer> 
                <TopLeftContainer>
                <TfiTarget {...topIconsCommonProps} onClick={handleOnClickCenterPosition}/>
                <SlSizeActual  {...topIconsCommonProps} onClick={handleOnClickDefaultSize}/>
                <SlSizeFullscreen  {...topIconsCommonProps} onClick={handleOnClickFullSize}/>
                {allowHide && <BsEyeSlashFill {...topIconsCommonProps} onClick={handleOnClickHide}/>}
              </TopLeftContainer>
              <TopRightContainer>
                <ConnectionStateView connectionState={connectionState}/>
              </TopRightContainer> 
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
                <TextInput css={css`border-color: ${mainColor};`} fromSpan value={messageBody} setValue={setMessageBody} onEnter={handleInputMessage} placeholder={"type message..."} onMouseDown={e => {setPreventFlag(e, true, true)}}/>
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
  height: 40px;
  width: 100%;
  border-style: solid;
  border-radius: 10px;
  border-color: ${mainColor};
  background-color: #DCDCDC;
  margin-bottom: 5px;
`
const TopLeftContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 15px;
`
const TopRightContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: auto;
`
const ConnectionStateView = styled.span<{connectionState: ConnectionState}>`
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
type ThumbnailViewProps = {
  visible: boolean
  top: number
  left: number
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const ViewThumbnail = ({visible, top, left, ...rest}: ThumbnailViewProps) => {
  const messageLine = <div css={css`background-color: black; width: 80%; height: 1px;`}/>
  return <ViewThumbnailContainer visible={visible} top={top} left={left} {...rest}>
         <div css={css`width: 32px; background-color: #DCDCDC; height: 4px; margin: 2px;`}/>
         <div css={css`display: flex; padding-left: 2px; padding-right: 2px; gap: 2px;`}>
         <div css={css`width: 6px; background-color: #DCDCDC; height: 21px; `}/>
         <div css={css`display: flex; flex-direction: column; gap: 2px;`}>
         <div css={css`display: flex; flex-direction: column; gap: 2px; align-items: center; justify-content: center; width: 24px; background-color: white; height: 16px;`}>
         {messageLine}
         {messageLine}
         {messageLine}
         {messageLine}
         {messageLine}
         </div>
         <div css={css`width: 24px; background-color: white; height: 3px;`}/>
         </div>
         </div>
         </ViewThumbnailContainer>
}
const ViewThumbnailContainer = styled.div<{visible: boolean, top: number, left: number}>`
  ${({visible, top, left}) => css`
  display: ${visible ? "block" : "none"};
  top: ${top}px;
  left: ${left}px;
  `}
  position: absolute;
  background-color: ${secondColor};
  width: 40px;
  height: 35px;
  border: 2px solid ${mainColor};
  cursor: pointer;
`