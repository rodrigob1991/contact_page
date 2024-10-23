import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import useChat, { UserMessageHandler, UsersConnectionHandler, UsersDisconnectionHandler } from "../../../../../hooks/with_jsx/chat/useChat"
import { ViewThumbnail as ChatViewThumbnail } from "../../../../../hooks/with_jsx/chat/useView"
import { messengerLayout as layout, maxWidthSmallestLayout, messengerSmallestLayout as smallestLayout } from "../../../../../layouts"
import { tooltipStyle } from "../../../../../theme"
import WithTooltip from "../../../../WithTooltip"
import LiveIcon from "/public/live.svg"
import { ConnectingHandler, ConnectedHandler, DisconnectedHandler } from "../../../../../hooks/chat/useWebSocket"

type Props = {}

const disconnectedStates = {iconColor: "#FF4500", tooltipText: "connect chat"}
const connectingStates = {iconColor: "#FFFF00", tooltipText: "stop connecting"}
const connectedStates = {iconColor: "#ADFF2F", tooltipText: "disconnect"}

export default function GuessChat({}: Props) {
    const [chatViewThumbnailVisible, setChatViewThumbnailVisible] = useState(true)
    const [connect, setConnect] = useState(false)
    const [iconColor, setIconColor] = useState(disconnectedStates.iconColor)
    const [tooltipText, setTooltipText] = useState(disconnectedStates.tooltipText)

    const connectingHandler: ConnectingHandler = () => {
        setIconColor(connectingStates.iconColor)
        setTooltipText(connectingStates.tooltipText)
    }
    const connectedHandler: ConnectedHandler = () => {
        setChatModalVisible(true)
        setChatViewThumbnailVisible(false)
        setIconColor(connectedStates.iconColor)
        setTooltipText(connectedStates.tooltipText)
    }
    const disconnectedHandler: DisconnectedHandler = () => {
        setIconColor(disconnectedStates.iconColor)
        setTooltipText(disconnectedStates.tooltipText)
    }

    const onClickLiveIconHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    /* const handleMouseMoveOnLiveIcon: MouseEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    }
    const handleTouchStartOnLiveIcon: TouchEventHandler<HTMLDivElement> = (e) => {
        setConnect(!connect)
    } */
    const onClickIconChatViewHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        setChatModalVisible(true)
        setChatViewThumbnailVisible(false)
    }
    const onHideHandler = () => {
        setChatModalVisible(false)
        setChatViewThumbnailVisible(true)
    }

    const hostConnectionHandler: UsersConnectionHandler = (hostName) => {
    }
    const hostDisconnectionHandler: UsersDisconnectionHandler = (hostName) => {
    }
    const hostMessageHandler: UserMessageHandler = (hostName, messageBody) => {
    }

    const {connectionState, setChatModalVisible, chatModal} = useChat({userType: "guess", usersConnectionHandler: hostConnectionHandler, usersDisconnectionHandler: hostDisconnectionHandler, userMessageHandler: hostMessageHandler,
                                                                connectingHandler, connectedHandler, disconnectedHandler, connect, viewProps: {position: {top: "50%", left: "50%"}, size: {height: "30%", width: "30%"}, allowHide: true, onHideHandler}})
    return <Container>
           <WithTooltip renderChildren={(handlers) => <LiveIconStyled fill={iconColor} {...handlers}/>}
                        tooltipText={tooltipText}
                        tooltipDeviation={{top: 0, left: 15}}
                        tooltipStyle={tooltipStyle}/>
           <ChatViewThumbnail visible={chatViewThumbnailVisible} onClick={onClickIconChatViewHandler}/>
           {chatModal}
           </Container>
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