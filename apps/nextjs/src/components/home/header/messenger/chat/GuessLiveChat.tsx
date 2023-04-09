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
    const [connect, setConnect] = useState(false)

    const handleOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
        setConnect(!connect)
    }

    const disconnectedIconProps = {color: "#FF4500", tooltipText: "connect chat"}
    const connectedIconProps = {color: "#ADFF2F", tooltipText: "disconnect chat"}
    const [iconProps, setIconProps] = useState(disconnectedIconProps)

    const onConnection = () => {
        setIconProps(connectedIconProps)
        setShow(true)
    }
    const onDisconnection = () => {
        setIconProps(disconnectedIconProps)
    }

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
        <>
            <ComponentWithTooltip childElement={<Image fill={iconProps.color}/>}
                                  tooltipText={iconProps.tooltipText}
                                  tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40}
                                  tooltipLeftDeviation={-70}
                                  onClick={handleOnClick}/>
            <LiveChat userType={"guess"} firstOnConnection={onConnection} firstOnDisconnection={onDisconnection} viewProps={{containerProps: {show: show, top: 50, left: 50}, hide: ()=> { setShow(false) }}}
                      firstHandleConMessage={handleConMessage} firstHandleDisMessage={handleDisMessage} firstHandleMesMessage={handleMesMessage} connect={connect}/>
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