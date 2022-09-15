import {useState} from "react"
import {AnyPropertiesCombinationRecursive} from "./Types"
import {isRecord} from "./TypesChecks"

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