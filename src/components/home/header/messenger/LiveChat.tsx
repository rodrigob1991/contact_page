import {useState} from "react"
import ComponentWithTooltip from "../../../ComponentWithTooltip"
import LiveIcon from "/public/live.svg"

export default function LiveChat() {
    const [liveChat, setLiveChat] = useState(false)
    let liveIconColor = liveChat ? "#ADFF2F" : "#FF4500"
    let liveIconTooltipText = liveChat ? "i'm connected" : "i'm not connected"

    return (
        <ComponentWithTooltip childElement={<LiveIcon className={"liveIcon"} fill={liveIconColor}/>}
                              tooltipText={liveIconTooltipText}
                              tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                              tooltipLeftDeviation={-70}/>
    )
}