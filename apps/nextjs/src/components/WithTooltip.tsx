import { Theme } from "@emotion/react"
import { Interpolation } from "@emotion/styled"
import { DetailedHTMLProps, HTMLAttributes, MouseEventHandler, TouchEventHandler, useEffect } from "react"
import { useTooltip } from "../hooks/useTooltip"

type Props = {
    children: JSX.Element | JSX.Element[]
    containerStyle?: Interpolation<Theme>
    tooltipText: string
    tooltipStyle?: Interpolation<Theme>
    tooltipOnMouse?: boolean
    tooltipDeviation?: {top: number, left:number}
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>,HTMLDivElement>
export default function WithTooltip({children, containerStyle, tooltipText, tooltipStyle, tooltipOnMouse=true, tooltipDeviation: {top:tooltipDeviationTop, left:tooltipDeviationLeft} = {top: 0, left: 0}, ...rest} : Props) {
    const [Tooltip, updateTooltip] = useTooltip({style: tooltipStyle})

    useEffect(() => {
        updateTooltip(undefined, tooltipOnMouse, tooltipDeviationTop, tooltipDeviationLeft, tooltipText, tooltipStyle)
    }, [tooltipText, tooltipStyle, tooltipOnMouse, tooltipDeviationTop, tooltipDeviationLeft])

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
        updateTooltip(true, tooltipOnMouse, top, left, tooltipText, tooltipStyle)
    }
    const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (e) => {
        updateTooltip(false)
    }
    const handleTouchStart: TouchEventHandler = (e) => {
        const {y, x} = e.currentTarget.getBoundingClientRect()

        setTimeout(() => {
            updateTooltip(true, false, y + tooltipDeviationTop, x + tooltipDeviationLeft)
            setTimeout(() => {updateTooltip(false)})
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
