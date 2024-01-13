import { css } from "@emotion/react"
import { MouseEventHandler, useEffect, useRef, useState } from "react"
import { mainColor, secondColor, thirdColor } from "../theme"
import { PositionCSS, SizeCSS, GetStyle, ResizableDraggableDiv, setPreventFlag, ContainerDivApi } from "../components/ResizableDraggableDiv"
import styled from "@emotion/styled"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"

type UseModalProps = {
    positionType?: "absolute" | "fixed" | "hooked"
    scrollableAncestor?: HTMLElement
    position?: PositionCSS
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
                               positionType: positionTypeProp = "fixed",
                               scrollableAncestor,
                               position: positionProp = centerPosition,
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
    const [position, setPosition] = useState(positionProp)
    const [size, setSize] = useState(sizeProp)

    const containerDivApiRef = useRef<ContainerDivApi>(null)
    const getContainerDivApi = () => containerDivApiRef.current as ContainerDivApi
    const [positionType, setPositionType] = useState<"absolute" | "fixed">()

    useEffect(() => {
      if(positionTypeProp === "hooked") {
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
                            setPositionType("absolute")
                            setPosition(({left}) => ({top, left}))
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
        setPositionType("absolute")
      }else {
        setPositionType(positionTypeProp)
      }
    }, [positionTypeProp, scrollableAncestor])

    const handleOnClickCenterPosition: MouseEventHandler<SVGElement> = (e) => {
        setPosition(centerPosition)
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
      position: ${positionType};
      min-height: ${minSize.height};
      min-width: ${minSize.width};
      max-height: 100%;
      max-width: 100%;
      transform: translate(-50%, -50%);
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

    const modal = <ResizableDraggableDiv ref={containerDivApiRef} draggable={draggable} resizable={resizable} getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: position, set: setPosition}}>
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