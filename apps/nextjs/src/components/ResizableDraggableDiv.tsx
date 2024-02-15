import { Interpolation, Theme, css } from "@emotion/react"
import styled from "@emotion/styled"
import { FocusEventHandler, MouseEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { exist } from "utils/src/objects"
import { getNumbers } from "utils/src/strings"
import { GetRect } from "../types/dom"

// attach this properties in mousedown event to prevent resize and/or drag 
const preventResizeMouseDownEventPropertyKey = "preventResize"
const preventResizeMouseDownEventProperty = {[preventResizeMouseDownEventPropertyKey]: true}
const preventDragMouseDownEventPropertyKey = "preventDrag"
const preventDragMouseDownEventProperty = {[preventDragMouseDownEventPropertyKey]: true}
export const setPreventFlag = (e: MouseEvent | React.MouseEvent, preventResize: boolean, preventDrag: boolean) => {
    Object.assign(e instanceof MouseEvent ? e : e.nativeEvent, {...preventResize ? preventResizeMouseDownEventProperty : {} , ...preventDrag ? preventDragMouseDownEventProperty : {}})
}
export const resizePrevented = (e: MouseEvent | React.MouseEvent) => {
    const nativeEvent = e instanceof MouseEvent ? e : e.nativeEvent
     return preventResizeMouseDownEventPropertyKey in nativeEvent && nativeEvent[preventResizeMouseDownEventPropertyKey] as boolean
}
export const dragPrevented = (e: MouseEvent | React.MouseEvent) => {
    const nativeEvent = e instanceof MouseEvent ? e : e.nativeEvent
    return preventDragMouseDownEventPropertyKey in nativeEvent && nativeEvent[preventDragMouseDownEventPropertyKey] as boolean
}

export type GetStyle = (resizing: boolean, dragging: boolean) => Interpolation<Theme>
export type SizeCSS = {height?: string; width?: string}
export type SetSizeCSS = (size: SizeCSS) => void
export type PositionCSS = {top?: string; left?: string, bottom?: string, right?: string}
export type PositionCSSKey = keyof PositionCSS
export type SetPositionCSS = (position: PositionCSS) => void
export type ContainsNode = (node: Node | undefined | null) => boolean
export type ContainerDivApi = {
    observeIntersection: (observer: IntersectionObserver) => void
    getComputedStyle: () => CSSStyleDeclaration
    getRect: GetRect
    containsNode: ContainsNode
}
export type EventsHandlers = {
    onFocusHandler?: FocusEventHandler<HTMLDivElement>
    onBlurHandler?: FocusEventHandler<HTMLDivElement>
    onStartResizingHandler?: () => void
    onEndResizingHandler?: () => void
    onStartDraggingHandler?: () => void
    onEndDraggingHandler?: () => void
}

type Props = {
    resizable: boolean
    draggable: boolean
    getContainerStyle?: GetStyle
    getResizableDivStyle?: GetStyle
    getDraggableDivStyle?: GetStyle
    children?: JSX.Element | JSX.Element[]
    size?: {value: SizeCSS, set: SetSizeCSS}
    position?: {value: PositionCSS, set: SetPositionCSS}
} & EventsHandlers

export const ResizableDraggableDiv = forwardRef<ContainerDivApi, Props>(({resizable, draggable, onStartResizingHandler, onEndResizingHandler, onStartDraggingHandler, onEndDraggingHandler, getContainerStyle, getResizableDivStyle, getDraggableDivStyle, children: propsChildren, size: sizeProp, position: positionProp, onFocusHandler, onBlurHandler}, containerDivApiRef) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const getContainer = () => containerRef.current as HTMLDivElement
    useImperativeHandle(containerDivApiRef, () => 
        ({
          observeIntersection(observer) {
            observer.observe(getContainer())
          },
          getComputedStyle() {
            return window.getComputedStyle(getContainer())
          },
          getRect() {
            return getContainer().getBoundingClientRect()
          },
          containsNode(node) {
           return  exist(node) && getContainer().contains(node)
          }
        })
    , [])
    
    const getContainerComputedNumbers = () => {
        const numbers = getNumbers((({height, width, top, left}) => height + width + top + left)(getComputedStyle(getContainer())))
        return {height: numbers[0], width: numbers[1], top: numbers[2], left: numbers[3]}
    }
    const getContainerRectNumbers = () => {
        const {height, width, top, left} = getContainer().getBoundingClientRect()
        return {rectHeight: height, rectWidth: width, rectTop: top , rectLeft: left}
    }

    const [localSize, setLocalSize] = useState({})
    let size: SizeCSS
    let setSize : SetSizeCSS
    if(sizeProp){
        size = sizeProp.value
        setSize = sizeProp.set
    }else{
        size = localSize
        setSize = setLocalSize
    }

    const [localPosition, setLocalPosition] = useState({})
    let position: PositionCSS
    let setPosition: SetPositionCSS
    if(positionProp) {
        position = positionProp.value
        setPosition = positionProp.set
    }else {
        position = localPosition
        setPosition = setLocalPosition
    }

    const [resizing, setResizing] = useState(false)
    const [dragging, setDragging] = useState(false)

    let children = <>{propsChildren}</>

    useEffect(() => {
        if (draggable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                setPosition({top: (top + e.movementY) + "px", left: (left + e.movementX) + "px"})
            }
            const handleMouseUp = (e: MouseEvent) => {
                setDragging(false)
                if (onEndDraggingHandler) onEndDraggingHandler()
            }
            const handleSelectStart = (e: Event) => {
                e.preventDefault()
            }
                
            if (dragging) {
                window.addEventListener("mousemove", handleMouseMove)
                window.addEventListener("mouseup", handleMouseUp)
                window.addEventListener("selectstart", handleSelectStart)
            }
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("selectstart", handleSelectStart)
            }
        }
    },[dragging])

    if (draggable) {
        const handleOnMouseDownDraggableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if (e.target == e.currentTarget || !dragPrevented(e)) {
                if (onStartDraggingHandler) onStartDraggingHandler()
                setDragging(true)
                setPreventFlag(e, true, false)
            }
        }
        children = <DraggableDiv css={getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : undefined} dragging={dragging} resizing={resizing} onMouseDown={handleOnMouseDownDraggableDiv}>{children}</DraggableDiv>
    }

    useEffect(() => {
        if (resizable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                const {rectHeight, rectWidth, rectTop, rectLeft} = getContainerRectNumbers()
                setSize({height: (height + e.movementY*2*(e.clientY >  rectTop + (rectHeight/2) ? 1 : -1)) + "px", width: (width + e.movementX*2*(e.clientX >  rectLeft + (rectWidth/2)  ? 1 : -1)) + "px"})
            }
            const handleMouseUp = (e: MouseEvent) => {
                setResizing(false)
                if (onEndResizingHandler) onEndResizingHandler()
            }
            const handleSelectStart = (e: Event) => {
                e.preventDefault()
            }

            if (resizing) {
                window.addEventListener("mousemove", handleMouseMove)
                window.addEventListener("mouseup", handleMouseUp)
                window.addEventListener("selectstart", handleSelectStart)
            }
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("", handleSelectStart)
            }
        }
    },[resizing])

    if (resizable) {
        const handleOnMouseDownResizableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target === e.currentTarget || !resizePrevented(e)) {
                if (onStartResizingHandler) onStartResizingHandler()
                setResizing(true)
            }
        }
        children = <ResizableDiv css={getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : undefined} dragging={dragging} onMouseDown={handleOnMouseDownResizableDiv}>{children}</ResizableDiv>
    }

    const handleOnMouseLeaveContainer: MouseEventHandler<HTMLDivElement>  = (e) => {
        //setResizing(false)
        //setDragging(false)
     }
    
    return <Container ref={containerRef} tabIndex={1} css={[getContainerStyle ? getContainerStyle(resizing, dragging) : undefined, size, position]} resizing={resizing} dragging={dragging} onMouseLeave={handleOnMouseLeaveContainer} onFocus={onFocusHandler} onBlur={onBlurHandler}>
           {children}
           </Container>
})

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
