import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { FocusEventHandler, MouseEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"
import { PartialPositionCSS, PositionCSSKey, PositionCSSValue } from "utils/src/css/position"
import { PartialSizeCSS } from "utils/src/css/size"
import { getNumber, upperCaseFirstChar } from "utils/src/strings"
import { ContainerDivApi, DoesContainsNode, EventsHandlers, GetStyle, ResizableDraggableDiv, setPreventFlag } from "../../components/ResizableDraggableDiv"
import { modalLayout } from "../../layouts"
import { mainColor, secondColor, thirdColor } from "../../theme"
import { GetRect } from "../../types/dom"

export type SetModalVisible = (visible: boolean, position?: ModalPosition) => void

type PositionKey = "top" | "left"
type PositionValue = "start" | "middle" |  "end" | PositionCSSValue
export type ModalPosition = {
  [K in PositionKey] : PositionValue
}
export type PositionType = "absolute" | "fixed" | "hooked"
type Ancestor<PT extends PositionType> = PT extends "hooked" ? HTMLElement : undefined
export type UseModalHookedProps<PT extends PositionType="hooked"> = {
  scrollableAncestor?: Ancestor<PT>
  containerAncestor?: Ancestor<PT>
}

export type ModalName = string | undefined
export const modalDefaultName = "modal"
export type ModalDefaultName = typeof modalDefaultName
export type ModalFullName<N extends ModalName> =  N extends undefined | "" ? ModalDefaultName : `${N}${Capitalize<ModalDefaultName>}`

export type UseModalProps<N extends ModalName, PT extends PositionType> = {
  name?: N
  positionType?: PT
  position?: ModalPosition
  size?: PartialSizeCSS
  minSize?: PartialSizeCSS
  resizable?: boolean
  draggable?: boolean
  visibleHideButton?: boolean
  visibleDefaultPositionButton?: boolean
  visibleCenterPositionButton?: boolean
  visibleDefaultSizeButton?: boolean
  visibleFullSizeButton?: boolean
  children: ReactNode
  topLeftChildren?: ReactNode
  topRightChildren?: ReactNode
  sibling?: ReactNode
  onHideHandler?: () => void
} & UseModalHookedProps<PT> & EventsHandlers
export type SetVisibleKey<N extends ModalName> = `set${Capitalize<ModalFullName<N>>}Visible`
export type IsVisibleKey<N extends ModalName> = `is${Capitalize<ModalFullName<N>>}Visible`
export type ModalKey<N extends ModalName> = ModalFullName<N>
export type DoesContainsNodeKey<N extends ModalName> = `does${Capitalize<ModalFullName<N>>}ContainsNode`
export type GetRectKey<N extends ModalName> = `get${Capitalize<ModalFullName<N>>}Rect`

export type SetVisibleReturn<N extends ModalName> = {[K in SetVisibleKey<N>]: SetModalVisible} 
export type IsVisibleReturn<N extends ModalName> = {[K in IsVisibleKey<N>]: () => boolean} 
export type ModalReturn<N extends ModalName> = {[K in ModalKey<N>]: ReactNode} 
export type DoesContainsNodeReturn<N extends ModalName> = {[K in DoesContainsNodeKey<N>]: DoesContainsNode} 
export type GetRectReturn<N extends ModalName> = {[K in GetRectKey<N>]: GetRect} 

export type UseModalReturn<N extends ModalName> = SetVisibleReturn<N> & IsVisibleReturn<N> & ModalReturn<N> & DoesContainsNodeReturn<N> & GetRectReturn<N>

const fullSize = {height: "100%", width: "100%"} as const
const centerPosition = {top: "50%", left: "50%"} as const

const positionsCssOpposites = {
  top: "bottom", bottom: "top", left: "right", right: "left"
} as const
const executeEffectValues = {1: 2, 2: 1} as const

const defaultPositionTypeCss = "absolute"

export default function useModal<N extends ModalName=undefined, PT extends PositionType="absolute">({
                               name,
                               positionType,
                               position={top: "middle", left: "middle"},
                               size: sizeProp = {height: "fit-content", width: "fit-content"},
                               minSize,
                               resizable=true,
                               draggable=true,
                               visibleHideButton=true,
                               visibleDefaultPositionButton: visibleDefaultPositionButtonProp=true,
                               visibleCenterPositionButton: visibleCenterPositionButtonProp=true,
                               visibleDefaultSizeButton: visibleDefaultSizeButtonProp=true,
                               visibleFullSizeButton: visibleFullSizeButtonProp=true,
                               children,
                               topLeftChildren,
                               topRightChildren,
                               sibling,
                               scrollableAncestor,
                               containerAncestor,
                               onHideHandler,
                               onMouseDownHandler: onMouseDownHandlerProp,
                               onFocusHandler: onFocusHandlerProp,
                               onBlurHandler: onBlurHandlerProp,
                               onStartResizingHandler: onStartResizingHandlerProp, 
                               onEndResizingHandler: onEndResizingHandlerProp, 
                               onStartDraggingHandler: onStartDraggingHandlerProp, 
                               onEndDraggingHandler: onEndDraggingHandlerProp
                              }: UseModalProps<N, PT>): UseModalReturn<N> {
    const [visible, setVisible] = useState(false)
 
    const [positionCss, setPositionCss] = useState<PartialPositionCSS>({})
    const [translateCss, setTranslateCss] = useState({top: "0", left: "0"})
    const setPosition = (position: ModalPosition) => {
      const nextPositionCss: PartialPositionCSS = {}
      const nextTranslateCss = {top: "0", left: "0"}
      for (const [key, value] of Object.entries(position)) {
        switch (value) {
          case "start":
            nextPositionCss[key as PositionKey] = "0"
            break;
          case "middle":
            nextPositionCss[key as PositionKey] = "50%"
            nextTranslateCss[key as PositionKey] = "-50%"
            break;
          case "end":
            nextPositionCss[positionsCssOpposites[key as PositionKey]] = "0"
            break;
          default:
            nextPositionCss[key as PositionKey] = value
        }
      }

      setPositionCss(nextPositionCss)
      setTranslateCss(nextTranslateCss)
    }
    useEffect(() => {
      setPosition(position)
    }, [position.top, position.left])

    const [size, setSize] = useState(sizeProp)

    const containerDivApiRef = useRef<ContainerDivApi>(null)
    const getContainerDivApi = () => containerDivApiRef.current as ContainerDivApi
    const doesContainsNode: DoesContainsNode = getContainerDivApi().doesContainsNode
    const getRect: GetRect = () => getContainerDivApi().getRect()
    const [positionTypeCss, setPositionTypeCss] = useState<"absolute" | "fixed">(defaultPositionTypeCss)

    // <specifics for hooked position type>
    const getScrollableAncestor = () => scrollableAncestor ?? document.body
    const getContainerAncestor = () => containerAncestor ?? getScrollableAncestor()

    const switchPositionTypeCss = (toType: "absolute" | "fixed", positionCss: PartialPositionCSS={}) => {
      setPositionTypeCss(toType)
      const {top: containerAncestorTop, left: containerAncestorLeft} = (toType === "absolute" ? getContainerAncestor() : getScrollableAncestor()).getBoundingClientRect()
      const {top: containerTop, left: containerLeft} = getContainerDivApi().getRect()
      const top = positionCss.top ?? `${containerTop - containerAncestorTop}px`
      const left = positionCss.left ?? `${containerLeft - containerAncestorLeft}px`
      const bottom = positionCss.bottom 
      const right = positionCss.right

      setPositionCss({top, left, bottom, right})
    }

    // just use for manually re-execute the effect
    const [executeEffectValue, setExecuteEffectValue] = useState<1 | 2>(1)
    // </specifics for hooked position type>

    useEffect(() => {
      if (positionType === "hooked") {
        const scrollableAncestor = getScrollableAncestor()
        const getScrollAxis = () => ({y: scrollableAncestor.scrollTop, x: scrollableAncestor.scrollLeft})
        const addInitialScrollEventHandler = () => {
          scrollableAncestor.addEventListener("scroll", initialScrollEventHandler)
        }
        const removeInitialScrollEventHandler = () => {
          scrollableAncestor.removeEventListener("scroll", initialScrollEventHandler)
        }
        const addSecondScrollEventHandler = () => {
          scrollableAncestor.addEventListener("scroll", secondScrollEventHandler)
        }
        const removeSecondScrollEventHandler = () => {
          scrollableAncestor.removeEventListener("scroll", secondScrollEventHandler)
        }
        const {top: scrollableAncestorRectTop, left: scrollableAncestorRectLeft} = scrollableAncestor.getBoundingClientRect()
        const {borderTopWidth: scrollableAncestorBorderTopWidthStr, borderLeftWidth: scrollableAncestorBorderLeftWidthStr} = getComputedStyle(scrollableAncestor)
        const scrollableAncestorBorderTopWidth = getNumber(scrollableAncestorBorderTopWidthStr) ?? 0
        const scrollableAncestorBorderLeftWidth = getNumber(scrollableAncestorBorderLeftWidthStr) ?? 0

        const scrollTopLimit = scrollableAncestorRectTop + scrollableAncestorBorderTopWidth
        const scrollLeftLimit = scrollableAncestorRectLeft + scrollableAncestorBorderLeftWidth
        const limits = {
          top: scrollTopLimit,
          left: scrollLeftLimit,
          bottom: scrollTopLimit + scrollableAncestor.clientHeight,
          right: scrollLeftLimit + scrollableAncestor.clientWidth
        }

        let secondScrollEventHandler: (e: Event) => void

        const onIntersection = (positionCssKey: PositionCSSKey, backToAbsolutePosition: () => boolean) => {
          removeInitialScrollEventHandler()
          switchPositionTypeCss("fixed", {[positionCssKey]: "0", [positionsCssOpposites[positionCssKey]]: "none"})
          secondScrollEventHandler = (e) => {
            if (backToAbsolutePosition()) {
              removeSecondScrollEventHandler()
              switchPositionTypeCss("absolute")
              addInitialScrollEventHandler()
            }
          }
          addSecondScrollEventHandler()
        }

        const initialScrollEventHandler = (e: Event) => {
          const { top, bottom, left, right } = getContainerDivApi().getRect()
          let scrollAxis = getScrollAxis()

          const backToAbsolutePosition = (axis: "x" | "y", c: -1 | 1) => {
            const currentScrollAxis = getScrollAxis()
            const back = (currentScrollAxis[axis] - scrollAxis[axis])*c >= 0
            scrollAxis = currentScrollAxis
            return back
          }

          let positionCssKey: PositionCSSKey | undefined
          let axis: "x" | "y"
          let c: -1 | 1
          if (top <= limits.top) {
            positionCssKey = "top"
            axis = "y"
            c = -1
          } else if (bottom >= limits.bottom) {
            positionCssKey = "bottom"
            axis = "y"
            c = 1
          } else if (left <= limits.left) {
            positionCssKey = "left"
            axis = "x"
            c = -1
          } else if (right >= limits.right) {
            positionCssKey = "right"
            axis = "x"
            c = 1
          }
          if(positionCssKey)
            onIntersection(positionCssKey, () => backToAbsolutePosition(axis, c))
        }

        setPositionTypeCss("absolute")
        addInitialScrollEventHandler()

        return () => {
          removeInitialScrollEventHandler()
          removeSecondScrollEventHandler()
        }
      } else {
        setPositionTypeCss(positionType || defaultPositionTypeCss)
      }
    }, [positionType, scrollableAncestor, containerAncestor, executeEffectValue])

    const onClickCenterPositionHandler: MouseEventHandler<SVGElement> = (e) => {
      setPosition({top: "middle", left: "middle"})
    }
    const onClickDefaultSizeHandler: MouseEventHandler<SVGElement> = (e) => {
      setSize(sizeProp)
    }
    const onClickFullSizeHandler: MouseEventHandler<SVGElement> = (e) => {
      setSize(fullSize)
    }
    const onClickHideHandler: MouseEventHandler<SVGElement> = (e) => {
      setVisible(false)
      if (onHideHandler) onHideHandler()
    }
    const onMouseDownHandler: MouseEventHandler<HTMLDivElement> = (e) => {
      if (onMouseDownHandlerProp) onMouseDownHandlerProp(e)
    }
    const onFocusHandler: FocusEventHandler<HTMLDivElement> = (e) => {
      if (onFocusHandlerProp) onFocusHandlerProp(e)
    }
    const onBlurHandler: FocusEventHandler<HTMLDivElement> = (e) => {
      if (onBlurHandlerProp) onBlurHandlerProp(e)
    }
    const onStartResizingHandler = () => {
      if (onStartResizingHandlerProp) onStartResizingHandlerProp()
    }
    const onEndResizingHandler = () => {
      if (onEndResizingHandlerProp) onEndResizingHandlerProp()
    }
    const onStartDraggingHandler = () => {
      if (positionTypeCss === "fixed") {
        switchPositionTypeCss("absolute")
        setExecuteEffectValue(executeEffectValues[executeEffectValue])
      }
      if (onStartDraggingHandlerProp) onStartDraggingHandlerProp()
    }
    const onEndDraggingHandler = () => {
      if (onEndDraggingHandlerProp) onEndDraggingHandlerProp()
    }

    const getContainerStyle: GetStyle = (resizing, dragging) => css`
      display: flex;
      visibility: ${visible ? "visible" : "hidden"};
      position: ${positionTypeCss};
      top: ${positionCss.top};
      left: ${positionCss.left};
      bottom: ${positionCss.bottom};
      right: ${positionCss.right};
      min-height: ${minSize?.height};
      min-width: ${minSize?.width};
      max-height: 100%;
      max-width: 100%;
      transform: translate(${translateCss.left}, ${translateCss.top});
      z-index: 9;
      ${!resizable && !draggable
        ? css`
            border: ${modalLayout.borderWidth}px solid ${mainColor};
            border-radius: 10px;
            padding: ${modalLayout.draggableDivPadding}px;
            background-color: ${secondColor};
          `
        : ""}
    `
    const getResizableDivStyle: GetStyle = (resizing, dragging) => css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: ${modalLayout.borderWidth}px;
      border-radius: 10px;
      background-color: ${mainColor};
    `
    const getDraggableDivStyle: GetStyle = (resizing, dragging) => css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: ${modalLayout.draggableDivPadding}px;
      height: 100%;
      width: 100%;
      border-radius: 10px;
      background-color: ${secondColor};
      ${!resizable ? css`border: ${modalLayout.borderWidth}px solid ${mainColor};`
                   : ""
      }
    `
    const visibleCenterPositionButton = draggable && visibleCenterPositionButtonProp
    const visibleDefaultSizeButton = resizable && visibleDefaultSizeButtonProp
    const visibleFullSizeButton = resizable && visibleFullSizeButtonProp

    const modal = <>
                  <ResizableDraggableDiv ref={containerDivApiRef} draggable={draggable} resizable={resizable} getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: positionCss, set: setPositionCss}} onMouseDownHandler={onMouseDownHandler} onFocusHandler={onFocusHandler} onBlurHandler={onBlurHandler} onStartResizingHandler={onStartResizingHandler} onEndResizingHandler={onEndResizingHandler} onStartDraggingHandler={onStartDraggingHandler} onEndDraggingHandler={onEndDraggingHandler}>
                  <>
                  {(visibleHideButton || visibleCenterPositionButton || visibleDefaultSizeButton || visibleFullSizeButton || topLeftChildren || topRightChildren) &&
                  <TopContainer>
                  <TopLeftContainer>
                  {topLeftChildren}
                  </TopLeftContainer>
                  {visibleCenterPositionButton &&
                  <TfiTarget {...buttonsCommonProps} onClick={onClickCenterPositionHandler}/>
                  }
                  {visibleDefaultSizeButton &&
                  <SlSizeActual  {...buttonsCommonProps} onClick={onClickDefaultSizeHandler}/>
                  }
                  {visibleFullSizeButton &&
                  <SlSizeFullscreen  {...buttonsCommonProps} onClick={onClickFullSizeHandler}/>
                  }
                  {visibleHideButton && 
                  <BsEyeSlashFill {...buttonsCommonProps} onClick={onClickHideHandler}/>
                  }
                  <TopRightContainer>
                  {topRightChildren}
                  </TopRightContainer>
                  </TopContainer>
                  }
                  {children}
                  </>
                  </ResizableDraggableDiv>
                  {sibling && sibling}
                  </>
    
    const setModalVisible: SetModalVisible = (visible, position) => {
      if (position) {
        setPosition(position)
      }
      setVisible(visible)
    }

    const fullName = (name ? name + upperCaseFirstChar(modalDefaultName) : modalDefaultName) as ModalFullName<N>
    const capitalizedFullName = upperCaseFirstChar(fullName)
                 
    const setVisibleKey: SetVisibleKey<N> = `set${capitalizedFullName}Visible`
    const isVisibleKey: IsVisibleKey<N> = `is${capitalizedFullName}Visible`
    const modalKey: ModalKey<N> = fullName
    const doesContainsNodeKey: DoesContainsNodeKey<N> = `does${capitalizedFullName}ContainsNode`
    const getRectKey: GetRectKey<N> = `get${capitalizedFullName}Rect`
    
    return {
      [setVisibleKey]: setModalVisible,
      [isVisibleKey]: () => visible,
      [modalKey]: modal,
      [doesContainsNodeKey]: doesContainsNode,
      [getRectKey]: getRect,
    } as UseModalReturn<N>         
}

const buttonsCommonProps = {size: 28, css: css`cursor: pointer; color: ${thirdColor}; padding: 2px;`, onMouseDown: (e: React.MouseEvent) => {setPreventFlag(e, true, true)}}

const TopContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding-bottom: 5px;
`
const TopLeftContainer = styled.div`
 display: flex;
 flex-direction: row;
 margin-right: auto
`
const TopRightContainer = styled.div`
 display: flex;
 flex-direction: row;
 margin-left: auto
`