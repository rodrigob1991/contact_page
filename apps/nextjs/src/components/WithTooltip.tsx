import { Theme } from "@emotion/react"
import { Interpolation } from "@emotion/styled"
import { DetailedHTMLProps, HTMLAttributes, MouseEventHandler, TouchEventHandler, useEffect, useRef } from "react"
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
    const [tooltip, updateTooltip] = useTooltip({style: tooltipStyle})
    const containerRef = useRef<HTMLDivElement>(null)
    const touchedRef = useRef(false)
    const isTouched = () => touchedRef.current
    const setTouched = (touched: boolean) => {touchedRef.current = touched}

    useEffect(() => {
        const update = () => {
            updateTooltip(undefined, tooltipOnMouse, tooltipDeviationTop, tooltipDeviationLeft, tooltipText, tooltipStyle)
        } 
        if (!isTouched()){
            update()
        } else {
            setTimeout(update, 1500)
        }
    }, [tooltipText, tooltipStyle, tooltipOnMouse, tooltipDeviationTop, tooltipDeviationLeft])

    const showTooltip = () => {
        let top
        let left
        if (tooltipOnMouse) {
          top = tooltipDeviationTop
          left = tooltipDeviationLeft
        } else {
          const {y, x} = (containerRef.current as HTMLDivElement).getBoundingClientRect()
          top = y + tooltipDeviationTop
          left = x + tooltipDeviationLeft
        }
        updateTooltip(true, tooltipOnMouse, top, left, tooltipText, tooltipStyle)
    }

    const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (e) => {
        showTooltip()
    }
    const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (e) => {
        updateTooltip(false)
    }
    const handleTouchStart: TouchEventHandler = (e) => {
        setTouched(true)
        showTooltip()
        setTimeout(() => {
            updateTooltip(false)
            setTouched(false)
        }, 1500)
    }

    return (
        <>
        {tooltip}
        <div ref={containerRef} css={containerStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
             onTouchStart={handleTouchStart} {...rest}>
            
            {children}
        </div>
        </>
    )
}
