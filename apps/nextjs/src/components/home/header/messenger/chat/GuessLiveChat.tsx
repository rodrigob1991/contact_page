import LiveChat, {FirstHandleConMessage, FirstHandleDisMessage, FirstHandleMesMessage} from "../../../../chat/LiveChat"
import ComponentWithTooltip from "../../../../ComponentWithTooltip"
import React, {useState} from "react"
import styled from "@emotion/styled"
import LiveIcon from "/public/live.svg"
import {maxWidthSmallestLayout} from "../../../../../dimensions"
import {ConnectionState, HandleNewConnectionState} from "../../../../../hooks/useWebSocket"
import {BsFillChatSquareTextFill} from "react-icons/bs"

type Props = {
    hostName: string
}

export default function GuessLiveChat({hostName}: Props) {
    const [showChatView, setShowChatView] = useState(false)
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
                setShowChatView(true)
                setShowIconChatView(true)
                break
        }
    }

    const handleOnClickLiveIcon = (e: React.MouseEvent<HTMLDivElement>) => {
        setConnect(!connect)
    }
    const handleOnClickIconChatView = (e: React.MouseEvent<SVGElement>) => {
        setShowChatView(!showChatView)
    }

    const disconnectedIconProps = {color: "#FF4500", tooltipText: "connect chat"}
    const connectingIconProps = {color: "#FFFF00", tooltipText: "connecting chat"}
    const connectedIconProps = {color: "#ADFF2F", tooltipText: "disconnect chat"}
    const [iconProps, setIconProps] = useState(disconnectedIconProps)

    const handleConMessage: FirstHandleConMessage<"guess"> = (cm) => {
    }
    const handleDisMessage: FirstHandleDisMessage<"guess"> = (dm) => {
    }
    const handleMesMessage: FirstHandleMesMessage<"guess"> = (mm) => {
    }

    const getHostName = (id: number) => hostName

    return (
        <Container>
            <ComponentWithTooltip childElement={<LiveIconStyled fill={iconProps.color}/>}
                                  tooltipText={iconProps.tooltipText}
                                  tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                                  tooltipLeftDeviation={-70}
                                  onClick={handleOnClickLiveIcon}/>
            { (showIconChatView && !showChatView) && <ChatViewIconStyled visibility={0} size={50} fill={"white"} onClick={handleOnClickIconChatView}/>}
            <LiveChat userType={"guess"} viewProps={{containerProps: {show: showChatView, top: 50, left: 50}, hide: ()=> { setShowChatView(false) }}}
                      firstHandleConMessage={handleConMessage} firstHandleDisMessage={handleDisMessage} firstHandleMesMessage={handleMesMessage}
                      nextHandleNewConnectionState={handleNewConnectionState} connect={connect} getOppositeUserName={getHostName}/>
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
