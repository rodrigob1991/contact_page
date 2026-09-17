import { useRef } from "react"
import { ChangeArrayTypes } from "utils/src/types"
import { KeyNumberValue, isNumber, isNumberArray } from "utils/src/types_checks"

type Value = number | KeyNumberValue | number[]
type GetDiff<V extends Value> =  V extends number ? (number: V) => number : V extends KeyNumberValue ? (keyNumberValue: V) => KeyNumberValue<keyof V> : V extends number[] ? (array: V) => ChangeArrayTypes<V, [[number, number]]> : never 
export function useGetDiffRef<V extends Value>(initValue: V) {
    const ref = useRef(initValue)
    const replace = (newValue: V) => {
        const currentValue = ref.current
        ref.current = newValue
        return currentValue
    }

    return (isNumber(initValue) ? 
           (number: V) => number as number - (replace(number) as number)
           : 
           isNumberArray(initValue) ?
           (array: V) => { 
            const currentArray = replace(array) as number[]
            return (array as number[]).map((number, index) => number - currentArray[index])
           }
           :
           (keyNumberValue: V) => {
            const keyNumberValueDiff: KeyNumberValue = {} 
            const currentKeyNumberValue = replace(keyNumberValue) as KeyNumberValue 
            for (const key in keyNumberValue) {
                keyNumberValueDiff[key] = keyNumberValue[key] as number - currentKeyNumberValue[key] 
            }
            return keyNumberValueDiff
           }) as GetDiff<V> 
}
