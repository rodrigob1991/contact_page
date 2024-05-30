import { css, keyframes } from "@emotion/react"

export type SyntheticCaretProps = {
    visible: boolean
    top?: number
    left?: number
    height?: number
    width?: number
}
export default function SyntheticCaret({visible, top=0, left=0, height=50, width=50}: SyntheticCaretProps) {
    return <div css={staticStyle} style={{display: visible ? "block" : "none", top: top + "px", left: left + "px", height: height + "px", width: width + "px"}}></div>
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
const staticStyle = css`
  background-color: black;
  position: absolute;
  animation: ${blink} 1s linear infinite;
`