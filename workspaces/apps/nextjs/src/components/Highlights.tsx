import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
 
type Props = {
  rects: DOMRect[]
}
export default function Highlights({rects}: Props) {
  let units = <></>
  const count = rects.length
  if (count > 0) {
    let {top: lastTop, left: lastLeft, right: maxRight, height: maxHeight} = rects[0]
    //let sumWidth = 0
  
    rects.forEach(({top, left, right, height, width}, index) => {
     /*  const repeatedTop = lastTop === top
      const last = index === count - 1
      if (repeatedTop) {
        //sumWidth += width
        if (right > maxRight)
          maxRight = right
        if (height > maxHeight)
          maxHeight = height
      } else {
        units = <>
                <Unit top={lastTop} left={lastLeft} height={maxHeight} width={maxRight - lastLeft} onTop={true} onBottom={true}/>
                {units}
                </>
        maxRight = right
        maxHeight = height
        lastTop = top
        lastLeft = left
      }
      if (last) {
        units = <>
                <Unit top={lastTop} left={lastLeft} height={height} width={maxRight - lastLeft} onTop={true} onBottom={true}/>
                {units}
                </>
      } */
     return units = <>
                    <Unit top={top} left={left} height={height} width={width} onTop={true} onBottom={true}/>
                    {units}
                    </>
    })
  }
  return units
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
  pointer-events: none;  
`