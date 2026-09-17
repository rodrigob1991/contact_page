import {useState} from "react"
import {AnyPropertiesCombinationRecursive} from "utils/src/types"
import {isRecord} from "utils/src/typesChecks"

export const useRecordState = <R extends Record<string, any>>(r: R) => {
    const [state, setState] = useState(r)
    const setDefaultState = () => {
        setState(r)
    }

    const setPropertiesRecursively = <T extends Record<string, any>>(r: T, subset: AnyPropertiesCombinationRecursive<T>) => {
        for (const key in subset) {
            const value = subset[key]
            if (isRecord(value)) {
                const rSubset = r[key]
                setPropertiesRecursively(rSubset, value as AnyPropertiesCombinationRecursive<typeof rSubset>)
            } else {
                r[key] = value as T[typeof key]
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