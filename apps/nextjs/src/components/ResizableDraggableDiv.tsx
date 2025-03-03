import { Interpolation, SerializedStyles, Theme, css } from "@emotion/react"
import { CSSProperties, Dispatch, FocusEventHandler, MouseEventHandler, SetStateAction, forwardRef, useImperativeHandle, useRef, useState } from "react"
import { CSSSize } from "utils/src/css/size"
import { CSSTranslate } from "utils/src/css/transform"
import { getNumbers } from "utils/src/strings"
import { UniteReturnType } from "utils/src/types"
import { useGetDiffRef } from "../hooks/references/useGetDiffRef"
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

export type SetCSSTranslate = Dispatch<SetStateAction<CSSTranslate | undefined>>
export type SetCSSSize = Dispatch<SetStateAction<CSSSize | undefined>>
/*export type UseCSSTranslateStateReturn = [PartialCSSTranslate, SetCSSTranslateState]
export type UseCSSSizeStateReturn = [PartialCSSSize, SetCSSSizeState] */
export type GetStyle = (resizing: boolean, dragging: boolean) => {inline?: CSSProperties, className?: string, interpolation?: Interpolation<Theme>}
export type DoesContainsNode = (node: Node | undefined | null) => boolean
export type ContainerDivApi = {
    observeIntersection: (observer: IntersectionObserver) => void
    getComputedStyle: () => CSSStyleDeclaration | undefined
    getRect: UniteReturnType<GetRect, undefined>
    doesContainsNode: DoesContainsNode
    focus: () => void
    setCssTranslate: SetCSSTranslate
    setCssSize: SetCSSSize
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
    /* useCSSTranslateStateReturn?: UseCSSTranslateStateReturn
    useCSSSizeStateReturn?: UseCSSSizeStateReturn */
    getContainerStyle?: GetStyle
    getResizableDivStyle?: GetStyle
    getDraggableDivStyle?: GetStyle
    children?: JSX.Element | JSX.Element[]
} & EventsHandlers

export const ResizableDraggableDiv = forwardRef<ContainerDivApi, Props>(({resizable, draggable, getContainerStyle, getResizableDivStyle, getDraggableDivStyle, onStartResizingHandler, onEndResizingHandler, onStartDraggingHandler, onEndDraggingHandler, children: childrenProp, onMouseDownHandler, onFocusHandler, onBlurHandler}, containerDivApiRef) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const getContainer = () => containerRef.current
    useImperativeHandle(containerDivApiRef, () => 
        ({
          observeIntersection(observer) {
            const container = getContainer()
            container && observer.observe(container)
          },
          getComputedStyle() {
            const container = getContainer()
            return container ? window.getComputedStyle(container) : undefined
          },
          getRect() {
            return getContainer()?.getBoundingClientRect()
          },
          doesContainsNode(node) {
           const container = getContainer()
           return  !!(container && node && container.contains(node))
          },
          focus() {
           getContainer()?.focus()
          }, 
          setCssTranslate, 
          setCssSize
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

    const [cssTranslate, setCssTranslate] = useState<CSSTranslate>(newCssTranslate())
    const [cssSize, setCssSize] =  useState<CSSSize>(newCssSize())

    const [resizing, setResizing] = useState(false)
    const [dragging, setDragging] = useState(false)

    let children = <>{childrenProp}</>

    // const getDiff = useGetDiffRef({x: 0, y: 0})
    // const getMouseMovement = (e: MouseEvent) => getDiff({x: e.screenX, y: e.screenY})
    const getMouseMovement = useGetDiffRef({screenX: 0, screenY: 0})

    // useEffect(() => {
    //     if (draggable && dragging) {
    //         if (onStartDraggingHandler) onStartDraggingHandler()

    //         const mouseMoveHandler = (e: MouseEvent) => {
    //             e.preventDefault()
    //             /* const {height, width, top, left} = getContainerComputedNumbers()
    //             setPosition({top: `${top + e.movementY}px`, left: `${left + e.movementX}px`}) */
    //             //setCssTranslate((t={x: {value: 0, unit: "px"}, y: {value: 0, unit: "px"}}) => ({x: {value: t.x.value}}))
    //             setCssTranslate((t) => t.getNewSum(getMouseMovement(e)))
    //         }
    //         const mouseUpHandler = (e: MouseEvent) => {
    //             setDragging(false)
    //             if (onEndDraggingHandler) onEndDraggingHandler()
    //         }
    //         const selectStartHandler = (e: Event) => {
    //             e.preventDefault()
    //         }
                
    //         window.addEventListener("mousemove", mouseMoveHandler)
    //         window.addEventListener("mouseup", mouseUpHandler)
    //         window.addEventListener("selectstart", selectStartHandler)

    //         return () => {
    //             window.removeEventListener("mousemove", mouseMoveHandler)
    //             window.removeEventListener("mouseup", mouseUpHandler)
    //             window.removeEventListener("selectstart", selectStartHandler)
    //         }
    //     }
    // }, [draggable, dragging])

    // if (draggable) {
    //     const onMouseDownDraggableDivHandler: MouseEventHandler<HTMLDivElement>  = (e) => {
    //         if (e.target === e.currentTarget || !dragPrevented(e)) {
    //             setDragging(true)
    //             getMouseMovement(e)
    //             setPreventFlag(e, true, false)
    //         }
    //     }
    //     const {inline, className, interpolation} = getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : {inline: undefined, className: undefined, interpolation: undefined}
    //     children = <div style={inline} className={className} css={[getCursorStyle(resizing, dragging, draggableDivCursorStyle), interpolation]} onMouseDown={onMouseDownDraggableDivHandler}>{children}</div>
    // }

    if (draggable) {
      const onMouseDownDraggableDivHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget || !dragPrevented(e)) {
          setDragging(true)
          getMouseMovement(e)
          setPreventFlag(e, true, false)

          const mouseMoveHandler = (e: MouseEvent) => {
            e.preventDefault()
            const {screenX, screenY} = getMouseMovement(e)
            setCssTranslate((t) => t.getNewSum({x: screenX, y: screenY}))
          }
          const selectStartHandler = (e: Event) => {
            e.preventDefault()
          }
          const mouseUpHandler = (e: MouseEvent) => {
            setDragging(false)
            window.removeEventListener("mousemove", mouseMoveHandler)
            window.removeEventListener("mouseup", mouseUpHandler)
            window.removeEventListener("selectstart", selectStartHandler)
            if (onEndDraggingHandler) onEndDraggingHandler()
          }

          window.addEventListener("mousemove", mouseMoveHandler)
          window.addEventListener("selectstart", selectStartHandler)
          window.addEventListener("mouseup", mouseUpHandler)

          if (onStartDraggingHandler) onStartDraggingHandler()
        }
      }
      const {inline, className, interpolation} = getDraggableDivStyle ? getDraggableDivStyle(resizing, dragging) : {inline: undefined, className: undefined, interpolation: undefined}

      children = <div style={inline} className={className} css={[getCursorStyle(resizing, dragging, draggableDivCursorStyle), interpolation]} onMouseDown={onMouseDownDraggableDivHandler}>
                 {children}
                 </div>
    }

    // useEffect(() => {
    //     if (resizable && resizing) {
    //         if (onStartResizingHandler) onStartResizingHandler()

    //         const mouseMoveHandler = (e: MouseEvent) => {
    //             e.preventDefault()
    //             //const {height, width, top, left} = getContainerComputedNumbers()
    //             const {rectHeight, rectWidth, rectTop, rectLeft} = getContainerRectNumbers()
    //             //setSize({height: `${height + e.movementY*2*(e.clientY >  rectTop + (rectHeight/2) ? 1 : -1)}px`, width: `${width + e.movementX*2*(e.clientX >  rectLeft + (rectWidth/2)  ? 1 : -1)}px`}) 
    //             setCssSize(s => s.getNewSum(getMouseMovement(e)))
    //         }
    //         const mouseUpHandler = (e: MouseEvent) => {
    //             setResizing(false)
    //             if (onEndResizingHandler) onEndResizingHandler()
    //         }
    //         const selectStartHandler  = (e: Event) => {
    //             e.preventDefault()
    //         }

    //         window.addEventListener("mousemove", mouseMoveHandler)
    //         window.addEventListener("mouseup", mouseUpHandler)
    //         window.addEventListener("selectstart", selectStartHandler)

    //         return () => {
    //             window.removeEventListener("mousemove", mouseMoveHandler)
    //             window.removeEventListener("mouseup", mouseUpHandler)
    //             window.removeEventListener("selectstart", selectStartHandler)
    //         }
    //     }
    // }, [resizable, resizing])

    // if (resizable) {
    //     const onMouseDownResizableDivHandler: MouseEventHandler<HTMLDivElement> = (e) => {
    //         if (e.target === e.currentTarget || !resizePrevented(e)) {
    //             setResizing(true)
    //             getMouseMovement(e)
    //         }
    //     }
    //     const {inline, className, interpolation} = getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : {inline: undefined, className: undefined, interpolation: undefined}
    //     children = <div style={inline} className={className} css={[getCursorStyle(resizing, dragging, resizableDivCursorStyle), interpolation]} onMouseDown={onMouseDownResizableDivHandler}>{children}</div>
    // }

    if (resizable) {
      const onMouseDownResizableDivHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.target === e.currentTarget || !resizePrevented(e)) {
          setResizing(true)
          getMouseMovement(e)

          const mouseMoveHandler = (e: MouseEvent) => {
            const container = getContainer()
            if (container) {
              e.preventDefault()
              const {height, width} = container.getBoundingClientRect()
              const {screenX, screenY} = getMouseMovement(e)
              setCssSize(newCssSize({height: height + screenY, width: width + screenX}))
            }
          }
          const selectStartHandler = (e: Event) => {
            e.preventDefault()
          }
          const mouseUpHandler = (e: MouseEvent) => {
            setResizing(false)
            window.removeEventListener("mousemove", mouseMoveHandler)
            window.removeEventListener("mouseup", mouseUpHandler)
            window.removeEventListener("selectstart", selectStartHandler)
            if (onEndResizingHandler) onEndResizingHandler()
          }

          window.addEventListener("mousemove", mouseMoveHandler)
          window.addEventListener("selectstart", selectStartHandler)
          window.addEventListener("mouseup", mouseUpHandler)

          if (onStartResizingHandler) onStartResizingHandler()
        }
      }

      const {inline, className, interpolation} = getResizableDivStyle ? getResizableDivStyle(resizing, dragging) : { inline: undefined, className: undefined, interpolation: undefined }

      children = <div style={inline} className={className} css={[getCursorStyle(resizing, dragging, resizableDivCursorStyle), interpolation]} onMouseDown={onMouseDownResizableDivHandler}>
                 {children}
                 </div>
    }

    const handleOnMouseLeaveContainer: MouseEventHandler<HTMLDivElement> = (e) => {
        //setResizing(false)
        //setDragging(false)
    }

    const {inline, className, interpolation} = getContainerStyle ? getContainerStyle(resizing, dragging) : {inline: undefined, className: undefined, interpolation: undefined}

    return <div ref={containerRef} style={{translate: cssTranslate.toString(), ...cssSize.toKeyValue(), ...inline}} className={className} css={[getCursorStyle(resizing, dragging), interpolation]} onMouseLeave={handleOnMouseLeaveContainer} onMouseDown={onMouseDownHandler} onFocus={onFocusHandler} onBlur={onBlurHandler}>
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
    } else if (dragging) {
      style = draggingStyle
    } else { 
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
