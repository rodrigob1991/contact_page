import { Interpolation, Theme, css } from "@emotion/react"
import styled from "@emotion/styled"
import { MouseEventHandler, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { getNumbers } from "utils/src/strings"

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
export type SizeCSS = {height: string; width: string}
export type SetSizeCSS = (size: SizeCSS) => void
export type PositionCSS ={top: string; left: string, bottom?: string, right?: string}
export type SetPositionCSS = (position: PositionCSS) => void
export type ContainerDivApi = {
    observeIntersection: (observer: IntersectionObserver) => void
    getComputedStyle: () => CSSStyleDeclaration
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
}

export const ResizableDraggableDiv = forwardRef<ContainerDivApi, Props>(({resizable, draggable, getContainerStyle, getResizableDivStyle, getDraggableDivStyle, children: propsChildren, size: sizeProp, position: positionProp}, containerDivApiRef) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const getContainer = () => containerRef.current as HTMLDivElement
    useImperativeHandle(containerDivApiRef, () => 
        ({
          observeIntersection(observer) {
            observer.observe(getContainer())
          },
          getComputedStyle() {
            return window.getComputedStyle(getContainer())
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

    const [localSize, setLocalSize] = useState({height: "none", width: "none"})
    let size: SizeCSS
    let setSize : SetSizeCSS
    if(sizeProp){
        size = sizeProp.value
        setSize = sizeProp.set
    }else{
        size = localSize
        setSize = setLocalSize
    }

    const [localPosition, setLocalPosition] = useState({top: "none", left: "none"})
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
        if(draggable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                setPosition({top: (top + e.movementY) + "px", left: (left + e.movementX) + "px"})
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
        }
        },[dragging])

    if(draggable) {
        const handleOnMouseDownDraggableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target == e.currentTarget || !dragPrevented(e)) {
                setDragging(true)
                setPreventFlag(e, true, false)
            }
        }
        children = <DraggableDiv css={getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : undefined} dragging={dragging} resizing={resizing} onMouseDown={handleOnMouseDownDraggableDiv}>{children}</DraggableDiv>
    }

    useEffect(() => {
        if(resizable) {
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault()
                const {height, width, top, left} = getContainerComputedNumbers()
                const {rectHeight, rectWidth, rectTop, rectLeft} = getContainerRectNumbers()
                setSize({height: (height + e.movementY*2*(e.clientY >  rectTop + (rectHeight/2) ? 1 : -1)) + "px", width: (width + e.movementX*2*(e.clientX >  rectLeft + (rectWidth/2)  ? 1 : -1)) + "px"})
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
    }
    },[resizing])

    if(resizable) {
        const handleOnMouseDownResizableDiv: MouseEventHandler<HTMLDivElement>  = (e) => {
            if(e.target === e.currentTarget || !resizePrevented(e)) {
                setResizing(true)
            }
        }
        children = <ResizableDiv css={getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : undefined} dragging={dragging} onMouseDown={handleOnMouseDownResizableDiv}>{children}</ResizableDiv>
    }

    const handleOnMouseLeaveContainer: MouseEventHandler<HTMLDivElement>  = (e) => {
        //setResizing(false)
        //setDragging(false)
     }
    
    return <Container ref={containerRef} css={[getContainerStyle ? getContainerStyle(resizing, dragging) : undefined, size, position]} resizing={resizing} dragging={dragging} onMouseLeave={handleOnMouseLeaveContainer}>
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
