import styled from "@emotion/styled"
import {useTooltip} from "../hooks/useTooltip"
import {CSSProperties, DetailedHTMLProps, HTMLAttributes} from "react"

type Props = {
    childElement: JSX.Element
    tooltipText: string
    tooltipStyle?: CSSProperties
    tooltipTopDeviation?: number
    tooltipLeftDeviation?: number
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>,HTMLDivElement>
export default function ComponentWithTooltip({childElement, tooltipText, tooltipStyle, tooltipTopDeviation, tooltipLeftDeviation, ...rest} : Props) {
    const [Tooltip, showTooltip, hideTooltip] = useTooltip({initText: tooltipText, style: tooltipStyle, topDeviation: tooltipTopDeviation, leftDeviation: tooltipLeftDeviation})

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        showTooltip()
    }
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        hideTooltip()
    }
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const {y: rectTop, x: rectLeft} = e.currentTarget.getBoundingClientRect()

        setTimeout(() => {
            showTooltip(undefined, {top: rectTop + 50, left: rectLeft - 20})
            setTimeout(hideTooltip, 1500)
        }, 200)
    }

    return (
        <Container onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
                   onTouchStart={handleTouchStart} {...rest}>
            {Tooltip}
            {childElement}
        </Container>
    )
}

const Container = styled.div`
  display: flex;
`