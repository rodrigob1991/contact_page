import LiveChat, {FirstHandleConMessage, FirstHandleDisMessage, FirstHandleMesMessage} from "../../../../chat/LiveChat"
import ComponentWithTooltip from "../../../../ComponentWithTooltip"
import React, {useState} from "react"
import styled from "@emotion/styled"
import LiveIcon from "/public/live.svg"
import {maxWidthSmallestLayout} from "../../../../../dimensions"
import {SeeOrUnseeButton} from "../../../../Buttons"
import {ConnectionState, HandleNewConnectionState} from "../../../../../hooks/useWebSocket"

type Props = {
    hostName: string
}

export default function GuessLiveChat({hostName}: Props) {
    const [showView, setShowView] = useState(false)
    const [connect, setConnect] = useState(false)
    const handleNewConnectionState: HandleNewConnectionState = (cs) => {
        switch (cs) {
            case ConnectionState.DISCONNECTED:
                setIconProps(disconnectedIconProps)
                setShowView(false)
                break
            case ConnectionState.CONNECTING:
                setIconProps(connectingIconProps)
                break
            case ConnectionState.CONNECTED:
                setIconProps(connectedIconProps)
                setShowView(true)
                break
        }
    }

    const handleOnClickLiveIcon = (e: React.MouseEvent<HTMLDivElement>) => {
        setConnect(!connect)
    }
    const handleOnClickSeeIcon = (e: React.MouseEvent<SVGElement>) => {
        setShowView(!showView)
    }

    const disconnectedIconProps = {color: "#FF4500", tooltipText: "connect chat"}
    const connectingIconProps = {color: "#FFFF00", tooltipText: "connecting chat"}
    const connectedIconProps = {color: "#ADFF2F", tooltipText: "disconnect chat"}
    const [iconProps, setIconProps] = useState(disconnectedIconProps)

    const handleConMessage: FirstHandleConMessage<"guess"> = (cm) => {
        return hostName
    }
    const handleDisMessage: FirstHandleDisMessage<"guess"> = (dm) => {
        return hostName
    }
    const handleMesMessage: FirstHandleMesMessage<"guess"> = (mm) => {
        return hostName
    }

    return (
        <Container>
            <ComponentWithTooltip childElement={<LiveIconStyled fill={iconProps.color}/>}
                                  tooltipText={iconProps.tooltipText}
                                  tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                                  tooltipLeftDeviation={-70}
                                  onClick={handleOnClickLiveIcon}/>
            <SeeViewButtonStyled see={showView} size={50} color={iconProps.color} onClick={handleOnClickSeeIcon}/>
            <LiveChat userType={"guess"} viewProps={{containerProps: {show: showView, top: 50, left: 50}, hide: ()=> { setShowView(false) }}}
                      firstHandleConMessage={handleConMessage} firstHandleDisMessage={handleDisMessage} firstHandleMesMessage={handleMesMessage}
                      nextHandleNewConnectionState={handleNewConnectionState} connect={connect}/>
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
const SeeViewButtonStyled = styled(SeeOrUnseeButton)`
  width: 60px;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 40px;
  }
`