import React, {CSSProperties, useEffect, useState} from "react"
import {AnyPropertiesCombinationRecursive} from "./Types"
import {isRecord} from "./TypesChecks"
import styled from "@emotion/styled";

export const useRecordState = <R extends Record<string, any>>(r: R) => {
    const [state, setState] = useState(r)
    const setDefaultState = () => {
        setState(r)
    }

    const setPropertiesRecursively = <T extends Record<string, any>>(r: T, subset: AnyPropertiesCombinationRecursive<T>) => {
        for (const key in subset) {
            const value = subset[key]
            if (isRecord(value)) {
                setPropertiesRecursively(r[key], value)
            } else {
                // @ts-ignore
                r[key] = value
            }
        }
    }
    const setSubSet = (subset: AnyPropertiesCombinationRecursive<R>) => {
        setState((state) => {
            const newState = {...state}
            setPropertiesRecursively(newState, subset)
            return newState
        })
    }

    return {state: state, setDefaultState: setDefaultState, setState: setSubSet}
}

export type Ask = (top: number, left: number) => void
export type Hide = () => void
export type IsAsking = () => boolean
export type UseAskProps = {
    child: JSX.Element
    onShow?: ()=> void
    maxWidth?: number
}
export const useAsk = ({child, onShow, maxWidth}: UseAskProps): [Ask, Hide, IsAsking , JSX.Element] => {
    const askInitialStates = {show: false, position: {top: 0, left: 0}}
    const {state, setState, setDefaultState: hide} = useRecordState(askInitialStates)
    const ask = (top: number, left: number) => {
        setState({show: true, position: {top: top, left: left}})
    }
    useEffect(() => {
        if (onShow && state.show) {
            onShow()
        }
    }, [state])

    const isAsking = () => state.show

    const Element = <AskContainer {...state} maxWidth={maxWidth}>
                    {child}
                    </AskContainer>

    return [ask, hide, isAsking, Element]
}
type AskContainerProps = { show: boolean, position: { top: number, left: number }, maxWidth?: number}
const AskContainer = styled.div<AskContainerProps>`
  display: ${({show, position:{top, left}, maxWidth}) => (show ? "flex" : "none") + ";"
    + "top: " + top + "px;"
    + "left: " + left + "px;"
    + (maxWidth ? "max-width: " + maxWidth + "px;" : "")}
  flex-direction: column;
  align-items: center;
  z-index: 1;
  position: absolute;
  cursor: move;
  border-style: solid;
  border-color: #000000;
  background-color: white;
`
type Props = {
    style?: CSSProperties
    topDeviation?: number
    leftDeviation?: number
}
type Position = {top: number, left: number}
export const useTooltip = ({style, topDeviation=0, leftDeviation=0}: Props) : [JSX.Element, (t: string, p?: Position)=> void, ()=> void] => {
    const [hidden, setHidden] = useState(true)
    const [position, setPosition] = useState({top: -1, left: -1})
    const [useMousePosition, setUseMousePosition] = useState(true)
    const [text, setText] = useState("")
    const show = (text: string, position?: Position) => {
        if (position) {
            setUseMousePosition(false)
            setPosition(position)
        } else {
            setUseMousePosition(true)
        }
        setText(text)
        setHidden(false)
    }
    const hide = () => {
        setHidden(true)
    }
    const captureMousePosition = (e: MouseEvent) => {
        setPosition({top: e.clientY + topDeviation , left: e.clientX + leftDeviation})
    }
    useEffect(() => {
        if (!hidden && useMousePosition) {
            window.addEventListener("mousemove", captureMousePosition)
        } else {
            window.removeEventListener("mousemove", captureMousePosition)
        }
        return () => window.removeEventListener("mousemove", captureMousePosition)
    }, [hidden, useMousePosition])

    const Tooltip = <TooltipContainer style={style} show={!hidden} {...position}>{text}</TooltipContainer>

    return [Tooltip, show, hide]
}

const TooltipContainer = styled.div<{show: boolean, left: number, top: number}>`
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  position: fixed;
  left: ${props=> props.left}px;
  top:  ${props=> props.top}px;
  z-index: 99;
  padding: 3px;
  background-color: white;
  font-size: 1.7rem;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  border-style: solid;
  border-color: black;
 `
