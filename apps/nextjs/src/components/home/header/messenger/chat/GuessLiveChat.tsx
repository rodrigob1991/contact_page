import LiveChat from "../../../../chat/LiveChat"
import ComponentWithTooltip from "../../../../ComponentWithTooltip"
import {useEffect, useState} from "react"
import styled from "@emotion/styled"
import LiveIcon from "/public/live.svg"
import {maxWidthSmallestLayout} from "../../../../../dimensions"
import {HandleConMessage, HandleDisMessage, HandleMesMessage} from "../../../../../types/chat"

export default function GuessLiveChat() {
    const [hostConnected, setHostConnected] = useState(false)

    const handleConMessage: HandleConMessage<"guess"> = (c) => {

    }
    const handleDisMessage: HandleDisMessage<"guess"> = (d) => {
        setHostConnected(false)
    }
    const handleMesMessage: HandleMesMessage<"guess"> = (m) => {
        setHostConnected(true)
    }

    let iconColor = hostConnected ? "#ADFF2F" : "#FF4500"
    let iconTooltipText = hostConnected ? "i'm connected" : "i'm not connected"

    return (
        <>
            <ComponentWithTooltip childElement={<Image fill={iconColor}/>}
                                  tooltipText={iconTooltipText}
                                  tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                                  tooltipLeftDeviation={-70}/>
            <LiveChat userType={"guess"} handleConMessage={handleConMessage} handleDisMessage={handleDisMessage} handleMesMessage={handleMesMessage}/>
        </>
    )
}

const Image = styled(LiveIcon)`
  width: 85px;
  height:85px;
  cursor: pointer;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 55px;
    height: 55px;
  }
`