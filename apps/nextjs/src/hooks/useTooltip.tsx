import { Interpolation, Theme, css } from "@emotion/react"
import { useEffect, useState } from "react"

type Props = {
    style?: Interpolation<Theme>
}
type Update = (visible?: boolean, onMouse?: boolean, top?: number, left?: number, text?: string, style?: Interpolation<Theme>) => void
export const useTooltip = ({style: styleProp}: Props): [JSX.Element, Update] => {
    
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({top: 0, left: 0})
    const [useMousePosition, setUseMousePosition] = useState(true)
    const [mouseDeviation, setMouseDeviation] = useState({top: 0, left: 0})
    const [text, setText] = useState("")
    const [style, setStyle] = useState(styleProp)

    const update: Update = (visible, onMouse, top, left, text, style) => {
        if(text !== undefined) 
           setText(text)
        if(visible !== undefined) 
           setVisible(visible)
        if(style !== undefined)
            setStyle(style)
        const nextUseMousePosition = onMouse !== undefined ? onMouse : useMousePosition
        if (nextUseMousePosition) {
            setUseMousePosition(true)
            setMouseDeviation({top: top !== undefined ? top : mouseDeviation.top, left: left !== undefined ? left : mouseDeviation.left})
        } else {
            setUseMousePosition(false)
            setPosition({top: top !== undefined ? top : position.top, left: left !== undefined ? left : position.left})
        }
    }
   
    useEffect(() => {
        const captureMousePosition = (e: MouseEvent) => {
            setPosition({top: e.clientY + mouseDeviation.top , left: e.clientX + mouseDeviation.left})
        }
        const captureTouchPosition = (e: TouchEvent) => {
            setPosition({top: e.touches[0].clientY + mouseDeviation.top , left: e.touches[0].clientX + mouseDeviation.left})
        }
        if (visible && useMousePosition) {
            window.addEventListener("mousemove", captureMousePosition)
            window.addEventListener("touchstart", captureTouchPosition)
        } 
        return () => { 
            window.removeEventListener("mousemove", captureMousePosition) 
            window.removeEventListener("touchstart", captureTouchPosition)
        } 
    }, [visible, useMousePosition])

    const defaultStyle = css`
                        position: fixed;
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
                        visibility: ${visible ? "visible" : "hidden"};
                        left: ${position.left}px;
                        top: ${position.top}px;
                        `

    const Tooltip = <div css={[defaultStyle, style]}>{text}</div>

    return [Tooltip, update]
}
