import React, {useEffect, useState} from "react"
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
export type Ask = (top: number, left: number) => void
export type Hide = () => void
export type IsAsking = () => boolean
export type UseAskProps = {
    child: JSX.Element
    onShow: ()=> void
    maxWidth?: number
}
export const useAsk = ({child, onShow, maxWidth}: UseAskProps): [Ask, Hide, IsAsking , JSX.Element] => {
    const askInitialStates = {show: false, position: {top: 0, left: 0}}
    const {state, setState, setDefaultState: hide} = useRecordState(askInitialStates)
    const ask = (top: number, left: number) => {
        setState({show: true, position: {top: top, left: left}})
    }
    useEffect(() => {
        if (state.show) {
            onShow()
        }
    }, [state.show])

    const isAsking = () => state.show

    const Element = <AskContainer {...state} maxWidth={maxWidth}>
                    {child}
                    </AskContainer>

    return [ask, hide, isAsking, Element]
}
