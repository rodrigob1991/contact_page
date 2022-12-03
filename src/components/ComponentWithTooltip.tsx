import styled from "@emotion/styled"
import {useTooltip} from "../utils/Hooks"
import {CSSProperties} from "react"

type Props = {
    ChildElement: JSX.Element
    tooltipText: string
    tooltipCssProperties?: CSSProperties
}
export default function ComponentWithTooltip({ChildElement, tooltipText, tooltipCssProperties} : Props) {
    const [Tooltip, showTooltip, hideTooltip] = useTooltip(tooltipCssProperties)

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        showTooltip(tooltipText, {top: e.pageY, left: e.pageX})
    }
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        hideTooltip()
    }
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        showTooltip(tooltipText, {top: e.touches[0].clientY -45, left: e.touches[0].clientX - 20})
        setTimeout(() => hideTooltip(), 1500)
    }

    return (
        <Container onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart}>
            {Tooltip}
            {ChildElement}
        </Container>
    )

}

const Container = styled.div`
  display: flex;
  block-size: fit-content;
`