import styled, { CSSObject} from "@emotion/styled"
import {useEffect, useState} from "react"

type Props = {
    style?: CSSObject
}
type Show = (visible: boolean, onMouse?: boolean, top?: number, left?: number, text?: string) => void
export const useTooltip = ({style}: Props): [JSX.Element, Show] => {
    
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({top: 0, left: 0})
    const [useMousePosition, setUseMousePosition] = useState(true)
    const [mouseDeviation, setMouseDeviation] = useState({top: 0, left: 0})
    const [text, setText] = useState("")

    const show: Show = (visible, onMouse=true, top=0, left=0, text="") => {
        if (onMouse) {
            setUseMousePosition(true)
            setMouseDeviation({top, left})
        } else {
            setPosition({top, left})
        }
        setText(text)
        setVisible(visible)
    }
   
    const captureMousePosition = (e: MouseEvent) => {
        setPosition({top: e.clientY + mouseDeviation.top , left: e.clientX + mouseDeviation.left})
    }
    useEffect(() => {
        if (visible && useMousePosition) {
            window.addEventListener("mousemove", captureMousePosition)
        } else {
            window.removeEventListener("mousemove", captureMousePosition)
        }
        return () => { window.removeEventListener("mousemove", captureMousePosition) }
    }, [visible, useMousePosition])

    const Tooltip = <Container css={style} show={visible} {...position}>{text}</Container>

    return [Tooltip, show]
}

const Container = styled.div<{show: boolean, left: number, top: number}>`
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