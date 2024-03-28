import { Interpolation, SerializedStyles, Theme, css } from "@emotion/react"
import { FocusEventHandler, MouseEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { PartialPositionCSS } from "utils/src/css/position"
import { PartialSizeCSS } from "utils/src/css/size"
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
export type SetSizeCSS = (size: PartialSizeCSS) => void
export type SetPositionCSS = (position: PartialPositionCSS) => void
export type ContainsNode = (node: Node | undefined | null) => boolean
export type ContainerDivApi = {
    observeIntersection: (observer: IntersectionObserver) => void
    getComputedStyle: () => CSSStyleDeclaration
    getRect: GetRect
    containsNode: ContainsNode
    focus: () => void
}
export type EventsHandlers = {
    onMouseDownHandler?: MouseEventHandler<HTMLDivElement>
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
    size?: {value: PartialSizeCSS, set: SetSizeCSS}
    position?: {value: PartialPositionCSS, set: SetPositionCSS}
} & EventsHandlers

export const ResizableDraggableDiv = forwardRef<ContainerDivApi, Props>(({resizable, draggable, onStartResizingHandler, onEndResizingHandler, onStartDraggingHandler, onEndDraggingHandler, getContainerStyle, getResizableDivStyle, getDraggableDivStyle, children: childrenProp, size: sizeProp, position: positionProp, onMouseDownHandler, onFocusHandler, onBlurHandler}, containerDivApiRef) => {
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
          },
          focus() {
           getContainer().focus()
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

    /* const [localSize, setLocalSize] = useState({})
    let size: PartialSizeCSS
    let setSize : SetSizeCSS
    if(sizeProp){
        size = sizeProp.value
        setSize = sizeProp.set
    }else{
        size = localSize
        setSize = setLocalSize
    }

    const [localPosition, setLocalPosition] = useState({})
    let position: PartialPositionCSS
    let setPosition: SetPositionCSS
    if(positionProp) {
        position = positionProp.value
        setPosition = positionProp.set
    }else {
        position = localPosition
        setPosition = setLocalPosition
    } */

    const [translate, setTranslate] = useState({x: 0, y: 0})
    const [scale, setScale] = useState({x: 1, y: 1})


    const [resizing, setResizing] = useState(false)
    const [dragging, setDragging] = useState(false)

    let children = <>{childrenProp}</>

    useEffect(() => {
        if (draggable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                /* const {height, width, top, left} = getContainerComputedNumbers()
                setPosition({top: `${top + e.movementY}px`, left: `${left + e.movementX}px`}) */
                setTranslate(({x,y}) => ({x: x + e.movementX, y: y + e.movementY}))
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
        children = <div css={[getCursorStyle(resizing, dragging, draggableDivCursorStyle), getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : undefined]} onMouseDown={handleOnMouseDownDraggableDiv}>{children}</div>
    }

    useEffect(() => {
        if (resizable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                /* const {height, width, top, left} = getContainerComputedNumbers()
                const {rectHeight, rectWidth, rectTop, rectLeft} = getContainerRectNumbers()
                setSize({height: `${height + e.movementY*2*(e.clientY >  rectTop + (rectHeight/2) ? 1 : -1)}px`, width: `${width + e.movementX*2*(e.clientX >  rectLeft + (rectWidth/2)  ? 1 : -1)}px`}) */
                setScale(({x, y}) => ({x: x + e.movementX/100, y: y + e.movementY/100}))
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
    }, [resizing])

    if (resizable) {
        const handleOnMouseDownResizableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target === e.currentTarget || !resizePrevented(e)) {
                if (onStartResizingHandler) onStartResizingHandler()
                setResizing(true)
            }
        }
        children = <div css={[getCursorStyle(resizing, dragging, resizableDivCursorStyle), getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : undefined]} onMouseDown={handleOnMouseDownResizableDiv}>{children}</div>
    }

    const handleOnMouseLeaveContainer: MouseEventHandler<HTMLDivElement>  = (e) => {
        //setResizing(false)
        //setDragging(false)
     }
    
    return <div ref={containerRef} style={{transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale.x}, ${scale.y})`}} css={[getCursorStyle(resizing, dragging), getContainerStyle ? getContainerStyle(resizing, dragging) : undefined]} onMouseLeave={handleOnMouseLeaveContainer} onMouseDown={onMouseDownHandler} onFocus={onFocusHandler} onBlur={onBlurHandler}>
           {children}
           </div>
})

const resizableDivCursorStyle = css`
  cursor: nesw-resize;
`
const draggableDivCursorStyle = css`
  cursor: grab;
`
const draggingStyle = css`
  cursor: grabbing;
`
const resizingStyle = css`
  cursor: nesw-resize;
`
const getCursorStyle = (resizing: boolean, dragging: boolean, defaultCursorStyle?: SerializedStyles) => {
    let style
    if (resizing) {
      style = resizingStyle
    }else if (dragging) {
      style = draggingStyle
    }else{
      style = defaultCursorStyle
    }
    return style
}

/* const Container = styled.div<{dragging: boolean, resizing: boolean}>`
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
const DraggableDiv = styled.div`
     cursor: grab;
` */
