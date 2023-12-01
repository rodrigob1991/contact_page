import styled from "@emotion/styled"
import { MouseEventHandler, useEffect, useState } from "react"
import { BsFillChatSquareTextFill } from "react-icons/bs"
import { ConnectionState, HandleNewConnectionState } from "../../../../../hooks/chat/useWebSocket"
import { maxWidthSmallestLayout } from "../../../../../layouts"
import WithTooltip from "../../../../WithTooltip"
import useChat, { HandleUserMessage, HandleUsersConnection, HandleUsersDisconnection } from "../../../../../hooks/chat/useChat"
import LiveIcon from "/public/live.svg"

type Props = {}

export default function GuessChat({}: Props) {
    const [showIconChatView, setShowIconChatView] = useState(false)
    const [connect, setConnect] = useState(false)

    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        switch (cs) {
            case ConnectionState.DISCONNECTED:
                setIconProps(disconnectedIconProps)
                setShowIconChatView(false)
                break
            case ConnectionState.CONNECTING:
                setIconProps(connectingIconProps)
                break
            case ConnectionState.CONNECTED:
                setIconProps(connectedIconProps)
                setChatVisible(true)
                setShowIconChatView(true)
                break
        }
    }

    const handleOnClickLiveIcon: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    const handleOnClickIconChatView: MouseEventHandler<SVGElement> = (e) => {
        setChatVisible(true)
    }

    const disconnectedIconProps = {color: "#FF4500", tooltipText: "connect chat"}
    const connectingIconProps = {color: "#FFFF00", tooltipText: "stop connecting"}
    const connectedIconProps = {color: "#ADFF2F", tooltipText: "disconnect"}
    const [iconProps, setIconProps] = useState(disconnectedIconProps)

    const handleHostConnection: HandleUsersConnection = (hostName) => {
    }
    const handleHostDisconnection: HandleUsersDisconnection = (hostName) => {
    }
    const handleHostMessage: HandleUserMessage = (hostName, messageBody) => {
    }

    const [setChatVisible, chatView] = useChat({userType: "guess", handleUsersConnection: handleHostConnection, handleUsersDisconnection: handleHostDisconnection, handleUserMessage: handleHostMessage,
                                       nextHandleNewConnectionState: handleNewConnectionState, connect, viewProps: {position: {top: "50%", left: "50%"}, size: {height: "30%", width: "30%"}, allowHide: true}})
    return (
        <Container>
            <WithTooltip
                tooltipText={iconProps.tooltipText}
                tooltipDeviation={{top: 20, left: 0}}
                onClick={handleOnClickLiveIcon}>
            <LiveIconStyled fill={iconProps.color}/>
            </WithTooltip>
            {showIconChatView && <ChatViewIconStyled visibility={0} size={50} fill={"white"} onClick={handleOnClickIconChatView}/>}
            {chatView}
        </Container>
    )
}

const Container = styled.div`
 display:flex;
 flex-direction: row;
 align-items: center;
 justify-content: center;
 gap: 15px;
`
const LiveIconStyled = styled(LiveIcon)`
  width: 85px;
  height:85px;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 55px;
    height: 55px;
  }
`
const ChatViewIconStyled = styled(BsFillChatSquareTextFill)`
  position: absolute;
  width: 70px;
  top: 90px;
  cursor: pointer;
  transform: rotate(180deg);
  @media (max-width: ${maxWidthSmallestLayout}px) {
    top: 54px;
    width: 40px;
  }
`
