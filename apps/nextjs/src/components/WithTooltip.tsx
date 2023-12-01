import { CSSObject } from "@emotion/styled"
import { DetailedHTMLProps, HTMLAttributes, MouseEventHandler, TouchEventHandler } from "react"
import { useTooltip } from "../hooks/useTooltip"

type Props = {
    children: JSX.Element | JSX.Element[]
    containerStyle?: CSSObject
    tooltipText: string
    tooltipStyle?: CSSObject
    tooltipOnMouse?: boolean
    tooltipDeviation?: {top: number, left:number}
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>,HTMLDivElement>
export default function WithTooltip({children, containerStyle, tooltipText, tooltipStyle, tooltipOnMouse=true, tooltipDeviation: {top:tooltipDeviationTop, left:tooltipDeviationLeft} = {top: 0, left: 0}, ...rest} : Props) {
    const [Tooltip, showTooltip] = useTooltip({style: tooltipStyle})

    const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (e) => {
        let top
        let left
        if (tooltipOnMouse) {
          top = tooltipDeviationTop
          left = tooltipDeviationLeft
        } else {
            const {y, x} = e.currentTarget.getBoundingClientRect()
            top = y + tooltipDeviationTop
            left = x + tooltipDeviationLeft
        }
        showTooltip(true, tooltipOnMouse, top, left, tooltipText)
    }
    const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (e) => {
        showTooltip(false)
    }
    const handleTouchStart: TouchEventHandler = (e) => {
        const {y, x} = e.currentTarget.getBoundingClientRect()

        setTimeout(() => {
            showTooltip(true, false, y + tooltipDeviationTop, x + tooltipDeviationLeft)
            setTimeout(() => {showTooltip(false)})
        }, 200)
    }

    return (
        <div css={containerStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                   onTouchStart={handleTouchStart} {...rest}>
            {Tooltip}
            {children}
        </div>
    )
}
