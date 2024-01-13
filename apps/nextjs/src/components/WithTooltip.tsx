import { Theme } from "@emotion/react"
import { Interpolation } from "@emotion/styled"
import { MouseEventHandler, TouchEventHandler, useEffect, useRef } from "react"
import { useTooltip } from "../hooks/useTooltip"

type Props = {
    renderChildren: (handlers: {onMouseEnter: MouseEventHandler, onMouseLeave: MouseEventHandler, onTouchStart: TouchEventHandler}) => JSX.Element,
    tooltipText: string
    tooltipStyle?: Interpolation<Theme>
    tooltipOnMouse?: boolean
    tooltipDeviation?: {top: number, left: number}
}

export default function WithTooltip({renderChildren, tooltipText, tooltipStyle, tooltipOnMouse=true, tooltipDeviation: {top:tooltipDeviationTop, left:tooltipDeviationLeft} = {top: 0, left: 0}, ...rest} : Props) {
    const [tooltip, updateTooltip] = useTooltip({style: tooltipStyle})
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

    const showTooltip = (element: Element) => {
        let top
        let left
        if (tooltipOnMouse) {
          top = tooltipDeviationTop
          left = tooltipDeviationLeft
        } else {
          const {y, x} = element.getBoundingClientRect()
          top = y + tooltipDeviationTop
          left = x + tooltipDeviationLeft
        }
        updateTooltip(true, tooltipOnMouse, top, left, tooltipText, tooltipStyle)
    }

    const handleMouseEnter: MouseEventHandler = (e) => {
        showTooltip(e.currentTarget)
    }
    const handleMouseLeave: MouseEventHandler = (e) => {
        updateTooltip(false)
    }
    const handleTouchStart: TouchEventHandler = (e) => {
        setTouched(true)
        showTooltip(e.currentTarget)
        setTimeout(() => {
            updateTooltip(false)
            setTouched(false)
        }, 1500)
    }

    return <>
          {tooltip}
          {renderChildren({onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onTouchStart: handleTouchStart})}
          </>
}
