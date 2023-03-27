import LiveChat, {FirstHandleConMessage, FirstHandleDisMessage, FirstHandleMesMessage} from "../../../../chat/LiveChat"
import ComponentWithTooltip from "../../../../ComponentWithTooltip"
import {useState} from "react"
import styled from "@emotion/styled"
import LiveIcon from "/public/live.svg"
import {maxWidthSmallestLayout} from "../../../../../dimensions"

type Props = {
    hostName: string
}

export default function GuessLiveChat({hostName}: Props) {
    const [show, setShow] = useState(false)
    const [hostConnected, setHostConnected] = useState(false)

    const handleConMessage: FirstHandleConMessage<"guess"> = (cm) => {
        setHostConnected(true)
        return hostName

    }
    const handleDisMessage: FirstHandleDisMessage<"guess"> = (dm) => {
        setHostConnected(false)
        return hostName
    }
    const handleMesMessage: FirstHandleMesMessage<"guess"> = (mm) => {
        return hostName
    }

    let iconColor = hostConnected ? "#ADFF2F" : "#FF4500"
    let iconTooltipText = hostConnected ? "i'm connected" : "i'm not connected"

    return (
        <>
            <ComponentWithTooltip childElement={<Image fill={iconColor}/>}
                                  tooltipText={iconTooltipText}
                                  tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                                  tooltipLeftDeviation={-70}/>
            <LiveChat userType={"guess"} viewContainerProps={{show: show, top: 50, left: 50}} firstHandleConMessage={handleConMessage} firstHandleDisMessage={handleDisMessage} firstHandleMesMessage={handleMesMessage}/>
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