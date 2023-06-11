import styled from "@emotion/styled"
import {useTooltip} from "../utils/Hooks"
import {CSSProperties, DetailedHTMLProps, HTMLAttributes, InputHTMLAttributes} from "react"

type Props = {
    childElement: JSX.Element
    tooltipText: string
    tooltipStyle?: CSSProperties
    tooltipTopDeviation?: number
    tooltipLeftDeviation?: number
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>,HTMLDivElement>
export default function ComponentWithTooltip({childElement, tooltipText, tooltipStyle, tooltipTopDeviation, tooltipLeftDeviation, ...rest} : Props) {
    const [Tooltip, showTooltip, hideTooltip] = useTooltip({style: tooltipStyle, topDeviation: tooltipTopDeviation, leftDeviation: tooltipLeftDeviation})

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        showTooltip(tooltipText)
    }
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        hideTooltip()
    }
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        showTooltip(tooltipText, {top: e.touches[0].clientY -45, left: e.touches[0].clientX - 20})
        setTimeout(() => hideTooltip(), 1500)
    }

    return (
        <Container onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} {...rest}>
            {Tooltip}
            {childElement}
        </Container>
    )

}

const Container = styled.div`
  display: flex;
  block-size: fit-content;
`