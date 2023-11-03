import styled from "@emotion/styled"
import {CSSProperties, useEffect, useState} from "react"

type Props = {
    initText?: string
    style?: CSSProperties
    topDeviation?: number
    leftDeviation?: number
}
type Position = {top: number, left: number}
export const useTooltip = ({initText, style, topDeviation=0, leftDeviation=0}: Props) : [JSX.Element, (t?: string, p?: Position)=> void, ()=> void] => {
    const [hidden, setHidden] = useState(true)
    const [position, setPosition] = useState({top: -1, left: -1})
    const [useMousePosition, setUseMousePosition] = useState(true)
    const [text, setText] = useState(initText ?? "")
    useEffect(() => {
        setText(initText ?? "")
    }, [initText])
    const show = (text?: string, position?: Position) => {
        if (position) {
            setUseMousePosition(false)
            setPosition(position)
        } else {
            setUseMousePosition(true)
        }
        if (text !== undefined) {
            setText(text)
        }
        setHidden(false)
    }
    const hide = () => {
        setHidden(true)
    }
    const captureMousePosition = (e: MouseEvent) => {
        setPosition({top: e.clientY + topDeviation , left: e.clientX + leftDeviation})
    }
    useEffect(() => {
        if (!hidden && useMousePosition) {
            window.addEventListener("mousemove", captureMousePosition)
        } else {
            window.removeEventListener("mousemove", captureMousePosition)
        }
        return () => { window.removeEventListener("mousemove", captureMousePosition) }
    }, [hidden, useMousePosition])

    const Tooltip = <TooltipContainer style={style} show={!hidden} {...position}>{text}</TooltipContainer>

    return [Tooltip, show, hide]
}

const TooltipContainer = styled.div<{show: boolean, left: number, top: number}>`
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  position: fixed;
  left: ${props=> props.left}px;
  top:  ${props=> props.top}px;
  z-index: 99;
  padding: 3px;
  height: fit-content;
  width: fit-content;
  background-color: white;
  font-size: 1.7rem;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  border-style: solid;
  border-color: darkblue;
  border-radius: 10px;
 `