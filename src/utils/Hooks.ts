import {useState} from "react"
import {AnyPropertiesCombination} from "./Types"

export const useRecordState = <R extends Record<string, any>>(r: R) => {
    const [state, setState] = useState(r)
    const setDefaultState = () => {
        setState(r)
    }

    const setSubSet = (subset: AnyPropertiesCombination<R>) => {
        setState((state) => {
            const newState = {...state}
            for (const key in subset) {
                // @ts-ignore
                newState[key] = subset[key]
            }
            return newState
        })
    }

    return {state: state, setDefaultState: setDefaultState, setState: setSubSet}
}