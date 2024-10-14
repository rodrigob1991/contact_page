import { css, keyframes } from "@emotion/react"
import styled from "@emotion/styled"
 
type Props = {
  rects: DOMRect[]
}
export default function Highlights({rects}: Props) {
    return <>
          {rects.map(({top,left, height, width}, index) => <Unit top={top} left={left} height={height} width={width} onTop={index === 0} onBottom={index === rects.length - 1}/>)}
          </>
}
const blink = keyframes`
  25% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
`
const Unit = styled.div<{top: number, left: number, height: number, width: number, onTop: boolean, onBottom: boolean}>`
  position: absolute;
  border-style: solid;
  border-color: red;
  ${({top, left, height, width, onTop, onBottom}) => `
    top: ${top}px;
    left: ${left}px;
    height: ${height}px;
    width: ${width}px;
    ${onTop ? "" : "border-top-style: none;"}
    ${onBottom ? "" : "border-bottom-style: none;"}
  `}
  animation: ${blink} 1s linear infinite;
`