import {useState} from "react"
import {AnyPropertiesCombinationRecursive} from "./Types"

export const useRecordState = <R extends Record<string, any>>(r: R) => {
    const [state, setState] = useState(r)
    const setDefaultState = () => {
        setState(r)
    }
    const setPropertiesRecursively = <ST extends Record<string, any>, T extends ST>(r: T, subset: ST) => {
        for (const key in subset) {
            const value = subset[key]
            if (value) {
                setPropertiesRecursively(r[key], value)
            } else {
                r[key] = value
            }
        }
    }
    setPropertiesRecursively({hola: "", pedro: 24}, {hola: "4"})

    const setSubSet = (subset: AnyPropertiesCombinationRecursive<R>) => {
        setState((state) => {
            const newState = {...state}
            setPropertiesRecursivly(newState, subset)
            return newState
        })
    }

    return {state: state, setDefaultState: setDefaultState, setState: setSubSet}
}