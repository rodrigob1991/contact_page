import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"
import { getNumber } from "utils/src/strings"
import { ContainerDivApi, ContainsNode, EventsHandlers, GetStyle, PositionCSS, PositionCSSKey, ResizableDraggableDiv, SizeCSS, setPreventFlag } from "../../components/ResizableDraggableDiv"
import { mainColor, secondColor, thirdColor } from "../../theme"

export type SetVisible = (visible: boolean, position?: ModalPosition) => void

type PositionKey = "top" | "left"
type PositionValue = "start" | "middle" |  "end" | `${number}${string}` | "none"
export type ModalPosition = {
  [K in PositionKey] : PositionValue
}
export type PositionType = "absolute" | "fixed" | "hooked"
type Ancestor<PT extends PositionType> = PT extends "hooked" ? HTMLElement : undefined
export type UseModalHookedProps<PT extends PositionType="hooked"> = {
  scrollableAncestor?: Ancestor<PT>
  containerAncestor?: Ancestor<PT>
}

export type UseModalProps<PT extends PositionType> = {
  positionType: PT
  position?: ModalPosition
  size?: SizeCSS
  minSize?: SizeCSS
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
  handleOnHide?: () => void
} & UseModalHookedProps<PT> & EventsHandlers

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

const positionsCssOpposites = {
  top: "bottom", bottom: "top", left: "right", right: "left"
} as const
const executeEffectValues = {1: 2, 2: 1} as const

export default function useModal<PT extends PositionType>({
                               positionType,
                               position={top: "middle", left: "middle"},
                               size: sizeProp = {height: "fit-content", width: "fit-content"},
                               minSize = {height: "none", width: "none"},
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
                               handleOnHide,
                               scrollableAncestor,
                               containerAncestor,
                               ...eventsHandlers
                              }: UseModalProps<PT>): [SetVisible, ReactNode, ContainsNode] {

    const [visible, setVisible] = useState(false)

    const [positionCss, setPositionCss] = useState({top: "none", left: "none", bottom: "none", right: "none"})
    const [translateCss, setTranslateCss] = useState({top: "0", left: "0"})
    const setPosition = (position: ModalPosition) => {
      const nextPositionCss = {top: "none", left: "none", bottom: "none", right: "none"}
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
            nextPositionCss[key as PositionKey]  = value
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
    const containsNode: ContainsNode = (node) => getContainerDivApi() ? getContainerDivApi().containsNode(node) : false
    const [positionTypeCss, setPositionTypeCss] = useState<"absolute" | "fixed">()

    // <specifics for hooked position type>
    const getScrollableAncestor = () => scrollableAncestor ?? document.body
    const getContainerAncestor = () => containerAncestor ?? getScrollableAncestor()

    const switchPositionTypeCss = (toType: "absolute" | "fixed", positionCss: PositionCSS={}) => {
      setPositionTypeCss(toType)
      const {top: containerAncestorTop, left: containerAncestorLeft} = (toType === "absolute" ? getContainerAncestor() : getScrollableAncestor()).getBoundingClientRect()
      const {top: containerTop, left: containerLeft} = getContainerDivApi().getRect()
      const top = positionCss.top ?? `${containerTop - containerAncestorTop}px`
      const left = positionCss.left ?? `${containerLeft - containerAncestorLeft}px`
      const bottom = positionCss.bottom ?? "none"
      const right = positionCss.right ?? "none"

      setPositionCss({top, left, bottom, right})
    }

    const [executeEffectValue, setExecuteEffectValue] = useState<1 | 2>(1)
    const onStartDragging = () => {
      if(positionTypeCss === "fixed") {
        switchPositionTypeCss("absolute")
        setExecuteEffectValue(executeEffectValues[executeEffectValue])
      }
    }
    // </specifics for hooked position type>

    useEffect(() => {
      if (positionType === "hooked") {
        const scrollableAncestor = getScrollableAncestor()
        scrollableAncestor.scroll
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
        setPositionTypeCss(positionType)
      }
    }, [positionType, scrollableAncestor, containerAncestor, executeEffectValue])

    const handleOnClickCenterPosition: MouseEventHandler<SVGElement> = (e) => {
      setPosition({ top: "middle", left: "middle" })
    }
    const handleOnClickDefaultSize: MouseEventHandler<SVGElement> = (e) => {
      setSize(sizeProp)
    }
    const handleOnClickFullSize: MouseEventHandler<SVGElement> = (e) => {
      setSize(fullSize)
    }
    const handleOnClickHide: MouseEventHandler<SVGElement> = (e) => {
      setVisible(false)
      if (handleOnHide) handleOnHide()
    }

    const getContainerStyle: GetStyle = (resizing, dragging) => css`
      display: ${visible ? "flex" : "none"};
      position: ${positionTypeCss};
      min-height: ${minSize.height};
      min-width: ${minSize.width};
      max-height: 100%;
      max-width: 100%;
      transform: translate(${translateCss.left}, ${translateCss.top});
      z-index: 9;
    `
    const getResizableDivStyle: GetStyle = (resizing, dragging) => css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: 6px;
      border-radius: 10px;
      background-color: ${mainColor};
    `
    const getDraggableDivStyle: GetStyle = (resizing, dragging) => css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5px;
      height: 100%;
      width: 100%;
      border-radius: 10px;
      background-color: ${secondColor};
      ${!resizable ? css`border: 6px solid ${mainColor};`
                   : ""
      }
    `
    const visibleCenterPositionButton = draggable && visibleCenterPositionButtonProp
    const visibleDefaultSizeButton = resizable && visibleDefaultSizeButtonProp
    const visibleFullSizeButton = resizable && visibleFullSizeButtonProp

    const modal = <>
                  <ResizableDraggableDiv ref={containerDivApiRef} draggable={draggable} resizable={resizable} getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: positionCss, set: setPositionCss}} onStartDragging={onStartDragging} {...eventsHandlers}>
                  <>
                  {(visibleHideButton || visibleCenterPositionButton || visibleDefaultSizeButton || visibleFullSizeButton || topLeftChildren || topRightChildren) &&
                  <TopContainer>
                  <TopLeftContainer>
                  {topLeftChildren}
                  </TopLeftContainer>
                  {visibleCenterPositionButton &&
                  <TfiTarget {...buttonsCommonProps} onClick={handleOnClickCenterPosition}/>
                  }
                  {visibleDefaultSizeButton &&
                  <SlSizeActual  {...buttonsCommonProps} onClick={handleOnClickDefaultSize}/>
                  }
                  {visibleFullSizeButton &&
                  <SlSizeFullscreen  {...buttonsCommonProps} onClick={handleOnClickFullSize}/>
                  }
                  {visibleHideButton && 
                  <BsEyeSlashFill {...buttonsCommonProps} onClick={handleOnClickHide}/>
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
                 
    return [
      (visible, position) => {
        if (position) {
          setPosition(position)
        }
        setVisible(visible)
      },
      modal,
      containsNode,
    ]             
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