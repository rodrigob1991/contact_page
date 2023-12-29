import { css } from "@emotion/react"
import { MouseEventHandler, useState } from "react"
import { mainColor, secondColor, thirdColor } from "../theme"
import { PositionCSS, SizeCSS, GetStyle, ResizableDraggableDiv, setPreventFlag } from "../components/ResizableDraggableDiv"
import styled from "@emotion/styled"
import { BsEyeSlashFill } from "react-icons/bs"
import { SlSizeActual, SlSizeFullscreen } from "react-icons/sl"
import { TfiTarget } from "react-icons/tfi"

type UseModalProps = {
    position?: PositionCSS
    size?: SizeCSS
    resizable?: boolean
    draggable?: boolean
    hidable?: boolean
    children: JSX.Element
    topLeftChildren?: JSX.Element
    topRightChildren?: JSX.Element
    handleOnHide?: () => void
}

const fullSize = {height: "100%", width: "100%"}
const centerPosition = {top: "50%", left: "50%"}

export default function useModal({position: positionProp = centerPosition,
                               size: sizeProp = {height: "50%", width: "30%"},
                               resizable=true,
                               draggable=true,
                               hidable=true,
                               children,
                               topLeftChildren,
                               topRightChildren,
                               handleOnHide}: UseModalProps): [(visible: boolean) => void, JSX.Element] {

    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState(positionProp)
    const [size, setSize] = useState(sizeProp)

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
      position: fixed;
      min-height: 350px;
      min-width: 350px;
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

    `
    const modal = <ResizableDraggableDiv draggable={draggable} resizable={resizable} getContainerStyle={getContainerStyle} getResizableDivStyle={getResizableDivStyle} getDraggableDivStyle={getDraggableDivStyle} size={{value: size, set: setSize}} position={{value: position, set: setPosition}}>
                  <TopContainer>
                  <TopLeftContainer>
                  {topLeftChildren}
                  </TopLeftContainer>
                  {draggable && 
                  <TfiTarget {...buttonsCommonProps} onClick={handleOnClickCenterPosition}/>
                  }
                  {resizable &&
                  <>
                  <SlSizeActual  {...buttonsCommonProps} onClick={handleOnClickDefaultSize}/>
                  <SlSizeFullscreen  {...buttonsCommonProps} onClick={handleOnClickFullSize}/>
                  </>
                  }
                  {hidable && 
                  <BsEyeSlashFill {...buttonsCommonProps} onClick={handleOnClickHide}/>
                  }
                  <TopRightContainer>
                  {topRightChildren}
                  </TopRightContainer>
                  </TopContainer>
                  {children}
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