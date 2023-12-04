import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import useChat, { HandleUserMessage, HandleUsersConnection, HandleUsersDisconnection } from "../../../../../hooks/chat/useChat"
import { ConnectionState, HandleNewConnectionState } from "../../../../../hooks/chat/useWebSocket"
import { maxWidthSmallestLayout } from "../../../../../layouts"
import WithTooltip from "../../../../WithTooltip"
import LiveIcon from "/public/live.svg"
import { TbArticleFilledFilled } from "react-icons/tb"
import { ViewThumbnail as ChatViewThumbnail } from "../../../../../hooks/chat/useView"
import { css } from "@emotion/react"
import { tooltipStyle } from "../../../../../theme"

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
    const handleOnClickIconChatView: MouseEventHandler<SVGElement> = (e) => {
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
            <ChatViewThumbnail visible={chatViewThumbnailVisible} top={35} left={80} onClick={handleOnClickIconChatView}/>
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
const ChatViewIcon = styled(TbArticleFilledFilled)`
  position: absolute;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    top: 54px;
    width: 40px;
  }
`
