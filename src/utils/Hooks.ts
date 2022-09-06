import {useState} from "react"

export type UpdateProperty<R extends Record<string, any>> = (key: keyof R, value: R[typeof key]) => void
export const useRecordState = <R extends Record<string, any>>(r: R): [R, (r: R) => void, UpdateProperty<R>] => {
    const [state, setState] = useState(r)
    const setProperty = <K extends keyof R>(key: K, value: R[K]) => {
        setState((state) => {
            const newState = {...state}
            newState[key] = value
            return newState
        })
    }
    return [state, setState, setProperty]
}