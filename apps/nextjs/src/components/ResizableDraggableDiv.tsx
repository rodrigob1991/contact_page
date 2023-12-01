import { Interpolation, Theme, css } from "@emotion/react"
import styled from "@emotion/styled"
import { MouseEventHandler, useEffect, useRef, useState } from "react"
import { getNumbers } from "utils/src/strings"

// attach this properties in mousedown event to avoid resize and/or drag 
const avoidResizeMouseDownEventPropertyKey = "avoidResize"
const avoidResizeMouseDownEventProperty = {[avoidResizeMouseDownEventPropertyKey]: true}
const avoidDragMouseDownEventPropertyKey = "avoidDrag"
const avoidDragMouseDownEventProperty = {[avoidDragMouseDownEventPropertyKey]: true}
export const setAvoidProperty = (e: MouseEvent | React.MouseEvent, avoidResize: boolean, avoidDrag: boolean) => {
    Object.assign(e instanceof MouseEvent ? e : e.nativeEvent, {...avoidResize ? avoidResizeMouseDownEventProperty : {} , ...avoidDrag ? avoidDragMouseDownEventProperty : {}})
}
export const avoidResize = (e: MouseEvent | React.MouseEvent) => {
    const nativeEvent = e instanceof MouseEvent ? e : e.nativeEvent
     return avoidResizeMouseDownEventPropertyKey in nativeEvent && nativeEvent[avoidResizeMouseDownEventPropertyKey] as boolean
}
export const avoidDrag = (e: MouseEvent | React.MouseEvent) => {
    const nativeEvent = e instanceof MouseEvent ? e : e.nativeEvent
    return avoidDragMouseDownEventPropertyKey in nativeEvent && nativeEvent[avoidDragMouseDownEventPropertyKey] as boolean
}

export type GetStyle = (resizing: boolean, dragging: boolean) => Interpolation<Theme>
export type SizeCSS = {height: string; width: string}
export type PositionCSS ={top: string; left: string}

type Props = {
    resizable: boolean
    draggable: boolean
    getContainerStyle?: GetStyle
    getResizableDivStyle?: GetStyle
    getDraggableDivStyle?: GetStyle
    children?: JSX.Element[]
    ultimateSize?: SizeCSS
    ultimatePosition?: PositionCSS
}

export const ResizableDraggableDiv = ({resizable, draggable, getContainerStyle, getResizableDivStyle, getDraggableDivStyle, children: propsChildren, ultimateSize: ultimateSizeProp={height: "none", width: "none"}, ultimatePosition: ultimatePositionProp={top: "none", left: "none"}}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const getContainer = () => containerRef.current as HTMLDivElement
    const getContainerComputedNumbers = () => {
        const numbers = getNumbers((({height, width, top, left}) => height + width + top + left)(getComputedStyle(getContainer())))
        return {height: numbers[0], width: numbers[1], top: numbers[2], left: numbers[3]}
    }
    const getContainerRectNumbers = () => {
        const {height, width, top, left} = getContainer().getBoundingClientRect()
        return {rectHeight: height, rectWidth: width, rectTop: top , rectLeft: left}
    }

    const [ultimateSize, setUltimateSize] = useState(ultimateSizeProp)
    useEffect(() => {
      setUltimateSize(ultimateSizeProp);
    }, [ultimateSizeProp.height, ultimateSizeProp.width]);

    const [ultimatePosition, setUltimatePosition] = useState(ultimatePositionProp)
    useEffect(() => {
        setUltimatePosition(ultimatePositionProp)
    }, [ultimatePositionProp.top, ultimatePositionProp.left])

    const [resizing, setResizing] = useState(false)
    const [dragging, setDragging] = useState(false)

    let children = <>{propsChildren}</>

    if(draggable) {
        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                setUltimatePosition({top: (top + e.movementY) + "px", left: (left + e.movementX) + "px"})
            }
            const handleMouseUp = (e: MouseEvent) => {
                setDragging(false)
            }
            const handleSelectStart = (e: Event) => {
                e.preventDefault()
            }
            
            if(dragging) {
                window.addEventListener("mousemove", handleMouseMove)
                window.addEventListener("mouseup", handleMouseUp)
                window.addEventListener("selectstart", handleSelectStart)
            }
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("selectstart", handleSelectStart)
            }
        },[dragging])

        const handleOnMouseDownDraggableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target == e.currentTarget || !avoidDrag(e)) {
                setDragging(true)
                setAvoidProperty(e, true, false)
            }
        }

        children = <DraggableDiv css={getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : undefined} dragging={dragging} resizing={resizing} onMouseDown={handleOnMouseDownDraggableDiv}>{children}</DraggableDiv>
    }

    if(resizable) {
        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                const {rectHeight, rectWidth, rectTop, rectLeft} = getContainerRectNumbers()
                setUltimateSize({height: (height + e.movementY*2*(e.clientY >  rectTop + (rectHeight/2) ? 1 : -1)) + "px", width: (width + e.movementX*2*(e.clientX >  rectLeft + (rectWidth/2)  ? 1 : -1)) + "px"})
            }
            const handleMouseUp = (e: MouseEvent) => {
                setResizing(false)
            }
            const handleSelectStart = (e: Event) => {
                e.preventDefault()
            }

            if(resizing) {
                window.addEventListener("mousemove", handleMouseMove)
                window.addEventListener("mouseup", handleMouseUp)
                window.addEventListener("selectstart", handleSelectStart)
            }
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("", handleSelectStart)
            }
        },[resizing])

        const handleOnMouseDownResizableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target === e.currentTarget || !avoidResize(e)) {
                setResizing(true)
            }
        }

        children = <ResizableDiv css={getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : undefined} dragging={dragging} onMouseDown={handleOnMouseDownResizableDiv}>{children}</ResizableDiv>
    }

    const handleOnMouseLeaveContainer: MouseEventHandler<HTMLDivElement>  = (e) => {
        //setResizing(false)
        //setDragging(false)
     }
    
    return <Container ref={containerRef} css={[getContainerStyle ? getContainerStyle(resizing, dragging) : undefined, ultimateSize, ultimatePosition]} resizing={resizing} dragging={dragging} onMouseLeave={handleOnMouseLeaveContainer}>
           {children}
           </Container>
}

const Container = styled.div<{dragging: boolean, resizing: boolean}>`
    ${({resizing, dragging}) => css`
        cursor: ${resizing ?  "nesw-resize" : dragging ? "grabbing" : "default"};
    `}
`

const ResizableDiv = styled.div<{dragging: boolean}>`
     padding: 20px;
    ${({dragging}) => css`
      cursor: ${dragging ? "grabbing"  : "nesw-resize"};
    `}
`
const DraggableDiv = styled.div<{dragging: boolean, resizing: boolean}>`
    ${({dragging, resizing}) => css`
     cursor: ${dragging ? "grabbing" :  resizing ? "nesw-resize" : "grab"};
    `}
`
