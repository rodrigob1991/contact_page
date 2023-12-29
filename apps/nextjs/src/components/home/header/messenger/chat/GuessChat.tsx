import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import useChat, { HandleUserMessage, HandleUsersConnection, HandleUsersDisconnection } from "../../../../../hooks/chat/useChat"
import { ViewThumbnail as ChatViewThumbnail } from "../../../../../hooks/chat/useView"
import { HandleConnected, HandleConnecting, HandleDisconnected } from "../../../../../hooks/chat/useWebSocket"
import { messengerLayout as layout, maxWidthSmallestLayout, messengerSmallestLayout as smallestLayout } from "../../../../../layouts"
import { tooltipStyle } from "../../../../../theme"
import WithTooltip from "../../../../WithTooltip"
import LiveIcon from "/public/live.svg"

type Props = {}

const disconnectedStates = {iconColor: "#FF4500", tooltipText: "connect chat"}
const connectingStates = {iconColor: "#FFFF00", tooltipText: "stop connecting"}
const connectedStates = {iconColor: "#ADFF2F", tooltipText: "disconnect"}

export default function GuessChat({}: Props) {
    const [chatViewThumbnailVisible, setChatViewThumbnailVisible] = useState(true)
    const [connect, setConnect] = useState(false)
    const [iconColor, setIconColor] = useState(disconnectedStates.iconColor)
    const [tooltipText, setTooltipText] = useState(disconnectedStates.tooltipText)

    const handleConnecting: HandleConnecting = () => {
        setIconColor(connectingStates.iconColor)
        setTooltipText(connectingStates.tooltipText)
    }
    const handleConnected: HandleConnected = () => {
        setChatVisible(true)
        setChatViewThumbnailVisible(false)
        setIconColor(connectedStates.iconColor)
        setTooltipText(connectedStates.tooltipText)
    }
    const handleDisconnected: HandleDisconnected = () => {
        setIconColor(disconnectedStates.iconColor)
        setTooltipText(disconnectedStates.tooltipText)
    }

    const handleOnClickLiveIcon: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    /* const handleMouseMoveOnLiveIcon: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    const handleTouchStartOnLiveIcon: TouchEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    } */
    const handleOnClickIconChatView: MouseEventHandler<HTMLDivElement> = (e) => {
        setChatVisible(true)
        setChatViewThumbnailVisible(false)
    }
    const handleOnHide = () => {
        setChatVisible(false)
        setChatViewThumbnailVisible(true)
    }

    const handleHostConnection: HandleUsersConnection = (hostName) => {
    }
    const handleHostDisconnection: HandleUsersDisconnection = (hostName) => {
    }
    const handleHostMessage: HandleUserMessage = (hostName, messageBody) => {
    }

    const [connectionState, setChatVisible, chatView] = useChat({userType: "guess", handleUsersConnection: handleHostConnection, handleUsersDisconnection: handleHostDisconnection, handleUserMessage: handleHostMessage,
                                                                handleConnecting, handleConnected, handleDisconnected, connect, viewProps: {position: {top: "50%", left: "50%"}, size: {height: "30%", width: "30%"}, allowHide: true, handleOnHide}})
    return (
        <Container>
            <WithTooltip
                tooltipText={tooltipText}
                tooltipDeviation={{top: 0, left: 15}}
                tooltipStyle={tooltipStyle}
                onClick={handleOnClickLiveIcon}>
            <LiveIconStyled fill={iconColor}/>
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