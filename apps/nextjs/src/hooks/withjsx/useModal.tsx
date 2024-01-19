import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"
import { ContainerDivApi, ContainsNode, GetStyle, PositionCSSKey, ResizableDraggableDiv, SizeCSS, setPreventFlag } from "../../components/ResizableDraggableDiv"
import { mainColor, secondColor, thirdColor } from "../../theme"

export type SetVisible = (visible: boolean) => void

type PositionKey = "top" | "left"
type PositionValue = "start" | "middle" |  "end" | `${number}${string}` | "none"
export type ModalPosition = {
  [K in PositionKey] : PositionValue
}

export type UseModalProps = {
    scrollableElement?: HTMLElement
    positionType?: "absolute" | "fixed" | "hooked"
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
    handleOnHide?: () => void
}

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

const positionsCssOpposites = {
  top: "bottom", bottom: "top", left: "right", right: "left"
} as const

export default function useModal({
                               scrollableElement,
                               positionType = "fixed",
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
                               handleOnHide}: UseModalProps): [SetVisible, ReactNode, ContainsNode] {

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
            nextPositionCss[positionsCssOpposites[key as PositionKey]]  = "0"
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
    const [positionTypeCss, setPositionTypeCss] = useState<"absolute" | "fixed">()

    useEffect(() => {
      if (positionType === "hooked") {
        let scrollableAncestor: HTMLElement | Window
        let getScrollAxis: () => {y: number, x: number}
        if (scrollableElement){
            scrollableAncestor = scrollableElement
          getScrollAxis = () => ({y: scrollableElement.scrollTop, x: scrollableElement.scrollLeft})
        }else{
          scrollableAncestor = window
          getScrollAxis = () => ({y: window.scrollY, x: window.scrollX})
        }

        const handleOverflow = (positionCssKey: PositionCSSKey, backToAbsolutePositionIf: () => boolean) => {
          const beforeOverflowPositionCssValue = getContainerDivApi().getComputedStyle()[positionCssKey]
          scrollableAncestor.removeEventListener("scroll", handleScroll)
          setPositionTypeCss("fixed")
          setPositionCss((positionCss) => {
            const nextPositionCss = {...positionCss}
            nextPositionCss[positionCssKey] = "0"
            nextPositionCss[positionsCssOpposites[positionCssKey]] = "none"
            return nextPositionCss
          })
          const handleSecondScroll = (e: Event) => {
            if (backToAbsolutePositionIf()) {
                scrollableAncestor.removeEventListener("scroll", handleSecondScroll)
                setPositionTypeCss("absolute")
                setPositionCss((positionCss) => {
                  const nextPositionCss = {...positionCss}
                  nextPositionCss[positionCssKey] = beforeOverflowPositionCssValue
                  return nextPositionCss
                })
                scrollableAncestor.addEventListener("scroll", handleScroll)
            }
          }
          scrollableAncestor.addEventListener("scroll", handleSecondScroll)
        }

        const handleScroll = () => {
          const {top, bottom, left, right} = getContainerDivApi().getRect()
          const {y: scrollY, x: scrollX} = getScrollAxis()

          if (top <= 0) {
            handleOverflow("top", () => getScrollAxis().y <= scrollY)
          } else if (bottom <= 0) {
            handleOverflow("bottom", () => getScrollAxis().y >= scrollY)
          } else if (left <= 0) {
            handleOverflow("left", () => getScrollAxis().x <= scrollX)
          } else if (right <= 0) {
            handleOverflow("right", () => getScrollAxis().x >= scrollX)
          }
        }

        setPositionTypeCss("absolute")
        scrollableAncestor.addEventListener("scroll", handleScroll)
      } else {
        setPositionTypeCss(positionType)
      }
    }, [positionType, scrollableElement])

    const handleOnClickCenterPosition: MouseEventHandler<SVGElement> = (e) => {
        setPosition({top: "middle", left: "middle"})
     }
     const handleOnClickDefaultSize: MouseEventHandler<SVGElement> = (e) => {
        setSize(sizeProp)
     }
     const handleOnClickFullSize: MouseEventHandler<SVGElement> = (e) => {
        setSize(fullSize)
     }
     const handleOnClickHide: MouseEventHandler<SVGElement> = (e) => {
         setVisible(false)
         if(handleOnHide)
            handleOnHide()
     }

    const getContainerStyle: GetStyle = (resizing, dragging) => css`
      display: ${visible ? "flex" : "none"};
      position: ${positionTypeCss};
      min-height: ${minSize.height};
      min-width: ${minSize.width};
      max-height: 100%;
      max-width: 100%;
      transform: translate(${translateCss.left}, ${translateCss.top});
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

    const modal = <ResizableDraggableDiv ref={containerDivApiRef} draggable={draggable} resizable={resizable} getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: positionCss, set: setPositionCss}}>
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
                 
    return [setVisible, modal, getContainerDivApi().containsNode]             
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