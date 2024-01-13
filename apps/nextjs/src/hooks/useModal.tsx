import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { MouseEventHandler, useEffect, useRef, useState } from "react"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"
import { ContainerDivApi, GetStyle, ResizableDraggableDiv, SizeCSS, setPreventFlag } from "../components/ResizableDraggableDiv"
import { mainColor, secondColor, thirdColor } from "../theme"

type PositionValue = "start" | "middle" |  "end" | `${number}${string}` | "none"
type Position = {
  top: PositionValue
  left: PositionValue
}

type UseModalProps = {
    scrollableAncestor?: HTMLElement
    positionType?: "absolute" | "fixed" | "hooked"
    position?: Position
    size?: SizeCSS
    minSize?: SizeCSS
    resizable?: boolean
    draggable?: boolean
    visibleHideButton?: boolean
    visibleDefaultPositionButton?: boolean
    visibleCenterPositionButton?: boolean
    visibleDefaultSizeButton?: boolean
    visibleFullSizeButton?: boolean
    children: JSX.Element
    topLeftChildren?: JSX.Element
    topRightChildren?: JSX.Element
    handleOnHide?: () => void
}

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

export default function useModal({
                               scrollableAncestor,
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
                               handleOnHide}: UseModalProps): [(visible: boolean) => void, JSX.Element] {

    const [visible, setVisible] = useState(false)

    const [positionCss, setPositionCss] = useState({top: "none", left: "none", bottom: "none", right: "none"})
    const [translateCss, setTranslateCss] = useState({top: "none", left: "none"})
    const setPosition = (topValue: PositionValue, leftValue: PositionValue) => {
      const nextPositionCss = {top: "none", left: "none", bottom: "none", right: "none"}
      const nextTranslateCss = {top: "none", left: "none"}
        switch (topValue) {
          case "start":
            nextPositionCss.top = "0"
            break;
          case "middle":
            nextPositionCss.top = "50%"
            nextTranslateCss.top = "-50%"
            break;
          case "end":
            nextPositionCss.bottom = "0"
            break;
          case "none":
            break;
          default:
            nextPositionCss.top = topValue
        }
        switch (leftValue) {
          case "start":
            nextPositionCss.left = "0"
            break;
          case "middle":
            nextPositionCss.left = "50%"
            nextTranslateCss.left = "-50%"
            break;
          case "end":
            nextPositionCss.right = "0"
            break;
          case "none":
            break;
          default:
            nextPositionCss.left = leftValue
        }
      setPositionCss(nextPositionCss)
      setTranslateCss(nextTranslateCss)
    }
    useEffect(() => {
      setPosition(position.top, position.left)
    }, [position])

    const [size, setSize] = useState(sizeProp)

    const containerDivApiRef = useRef<ContainerDivApi>(null)
    const getContainerDivApi = () => containerDivApiRef.current as ContainerDivApi
    const [positionTypeCss, setPositionTypeCss] = useState<"absolute" | "fixed">()

    useEffect(() => {
      if(positionType === "hooked") {
        const getScrollableAncestor = () => scrollableAncestor ?? window
        const getScrollY = () => scrollableAncestor ? scrollableAncestor.scrollTop : window.scrollY
        const options = {
            root: undefined,
            rootMargin: "0px",
            threshold: 1
        }
        const callback: IntersectionObserverCallback = (intersections, observer) => {
          intersections.forEach(intersection => {
                if (!intersection.isIntersecting) {
                    console.log("INTERSECT")
                    const scrollY = getScrollY()
                    const top = getContainerDivApi().getComputedStyle().top
                    const handleScroll = (e: Event) => {
                        if(getScrollY() <= scrollY) {
                          getScrollableAncestor().removeEventListener("scroll", handleScroll)
                            setPositionTypeCss("absolute")
                            setPositionCss(({left, right}) => ({top, left, right, bottom: "none"}))
                        }
                    }
                    getScrollableAncestor().addEventListener("scroll", handleScroll)
                    //setPositionType("fixed")
                    //setPosition(({left}) => ({top: "0px", left}))
                }
                console.log(intersection)
            })
        }
        const observer = new IntersectionObserver(callback, options)
        getContainerDivApi().observeIntersection(observer)
        setPositionTypeCss("absolute")
      }else {
        setPositionTypeCss(positionType)
      }
    }, [positionType, scrollableAncestor])

    const handleOnClickCenterPosition: MouseEventHandler<SVGElement> = (e) => {
      setPosition("middle", "middle")
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
      transform: translate(-50%, -50%);
      transform: translate(${translateCss.top}, ${translateCss.left});
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
                 
    return [setVisible, modal]             
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