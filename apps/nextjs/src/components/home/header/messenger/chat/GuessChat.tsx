import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import useChat, { HandleUserMessage, HandleUsersConnection, HandleUsersDisconnection } from "../../../../../hooks/chat/useChat"
import { ViewThumbnail as ChatViewThumbnail } from "../../../../../hooks/chat/useView"
import { ConnectionState, HandleNewConnectionState } from "../../../../../hooks/chat/useWebSocket"
import { maxWidthSmallestLayout, messengerLayout as layout, messengerSmallestLayout as smallestLayout} from "../../../../../layouts"
import { tooltipStyle } from "../../../../../theme"
import WithTooltip from "../../../../WithTooltip"
import LiveIcon from "/public/live.svg"

type Props = {}

const disconnectedIconProps = {color: "#FF4500", tooltipText: "connect chat"}
const connectingIconProps = {color: "#FFFF00", tooltipText: "stop connecting"}
const connectedIconProps = {color: "#ADFF2F", tooltipText: "disconnect"}

export default function GuessChat({}: Props) {
    const [chatViewThumbnailVisible, setChatViewThumbnailVisible] = useState(true)
    const [connect, setConnect] = useState(false)
    const [iconProps, setIconProps] = useState(disconnectedIconProps)

    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        switch (cs) {
            case ConnectionState.DISCONNECTED:
                setIconProps(disconnectedIconProps)
                break
            case ConnectionState.CONNECTING:
                setIconProps(connectingIconProps)
                break
            case ConnectionState.CONNECTED:
                setIconProps(connectedIconProps)
                setChatVisible(true)
                setChatViewThumbnailVisible(false)
                break
        }
    }

    const handleOnClickLiveIcon: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    const handleOnClickIconChatView: MouseEventHandler<HTMLDivElement> = (e) => {
        setChatVisible(true)
        setChatViewThumbnailVisible(false)
    }
    const handleOnClickHide = () => {
          setChatVisible(false)
          setChatViewThumbnailVisible(true)
    }

    const handleHostConnection: HandleUsersConnection = (hostName) => {
    }
    const handleHostDisconnection: HandleUsersDisconnection = (hostName) => {
    }
    const handleHostMessage: HandleUserMessage = (hostName, messageBody) => {
    }

    const [setChatVisible, chatView] = useChat({userType: "guess", handleUsersConnection: handleHostConnection, handleUsersDisconnection: handleHostDisconnection, handleUserMessage: handleHostMessage,
                                       nextHandleNewConnectionState: handleNewConnectionState, connect, viewProps: {position: {top: "50%", left: "50%"}, size: {height: "30%", width: "30%"}, allowHide: true, handleOnClickHide}})
    return (
        <Container>
            <WithTooltip
                tooltipText={iconProps.tooltipText}
                tooltipDeviation={{top: 0, left: 15}}
                tooltipStyle={tooltipStyle}
                onClick={handleOnClickLiveIcon}>
            <LiveIconStyled fill={iconProps.color}/>
            </WithTooltip>
            <ChatViewThumbnail visible={chatViewThumbnailVisible} onClick={handleOnClickIconChatView}/>
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
  width: ${layout.liveIconSize}px;
  height: ${layout.liveIconSize}px;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
  width: ${smallestLayout.liveIconSize}px;
  height: ${smallestLayout.liveIconSize}px;
  }
`