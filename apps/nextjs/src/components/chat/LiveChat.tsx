import {useEffect, useState} from "react"
import ComponentWithTooltip from "../ComponentWithTooltip"
import LiveIcon from "/public/live.svg"
import styled from "@emotion/styled"
import {maxWidthSmallestLayout} from "../../Dimensions"
import useWebSocket from "../../hooks/useWebSocket"
import {UserType} from "chat-common/src/model/types"
import {InboundMessageUser} from "../../types/chat"

type Props<UT extends UserType> = {
    userType: UT
    onMessage: (m: InboundMessageUser<UT>) => void
}

export default function LiveChat<UT extends UserType>({userType, onMessage}: Props<UT>) {

    //const sendMessage = useWebSocket()
    const [liveChat, setLiveChat] = useState(false)
    useEffect(() => {

    }, [liveChat])
    let liveIconColor = liveChat ? "#ADFF2F" : "#FF4500"
    let liveIconTooltipText = liveChat ? "i'm connected" : "i'm not connected"

    return (
        <>
        <ComponentWithTooltip childElement={<Image fill={liveIconColor}/>}
                              tooltipText={liveIconTooltipText}
                              tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                              tooltipLeftDeviation={-70}/>
    {/*    <MessagesContainer>
            {messages.map((m, index) => {
                if (isOutboundMessage(m)) {
                    return (<OutboundMessageView state={m.state} color={USER_COLOR} key={index}>
                        {username + ": " + m.body}
                    </OutboundMessageView>)
                } else {
                    return (<InboundMessageView color={m.color} key={index}>
                        {m.from + ": " + m.body}
                    </InboundMessageView>)
                }
            })}
            <div ref={messagesEndRef}/>
        </MessagesContainer>*/}
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