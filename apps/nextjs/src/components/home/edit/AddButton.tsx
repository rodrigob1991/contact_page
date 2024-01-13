import { css } from "@emotion/react"
import WithTooltip from "../../WithTooltip"
import { PlusButton } from "../../Buttons"
import { mainColor, tooltipStyle } from "../../../theme"
import { MouseEventHandler } from "react"

type Props = {
    position: "middle" | "right"
    tooltipText: string
    handleOnClick: MouseEventHandler<SVGAElement>
}

export default function AddButton({position, tooltipText, handleOnClick}: Props){
    const getStyle = () => {
        let style
        switch (position) {
            case "middle":
                style = middleStyle
                break
            case "right":
                style = rightStyle
                break
        }
        return style
    }

    return <WithTooltip renderChildren={(handlers) => <PlusButton css={getStyle()} size={50} color={mainColor} onClick={handleOnClick} {...handlers}/>} 
                        tooltipText={tooltipText} tooltipOnMouse={false} tooltipDeviation={{top: 55, left: 0}} tooltipStyle={tooltipStyle}/>
}

const commonStyle = css`
              position: absolute;
`

const middleStyle = css`
              ${commonStyle}
              top: 50%;
              left: 50%; 
              transform: translate(-50%, -50%);
` 

const rightStyle = css`
              ${commonStyle}
              left: 150%; 
` 