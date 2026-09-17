import { useRef as useReactRef } from "react"
import { IfExtends } from "utils/src/types"

type GetRef<T> = () => null extends T ? Exclude<T, null> | undefined : T
type SetRef<T> = (v: T | IfExtends<T, [[null, undefined], [undefined, null]]>) => void
type UseRefReturn<T> = [GetRef<T>, SetRef<T>]
type UseRef = {
    <T = undefined>(): UseRefReturn<T | undefined>
    <T>(initialValue: T): UseRefReturn<T>
} 

const useRef: UseRef = function (initValue?) {
    const ref = useReactRef(initValue ?? undefined)
    const getRef = () => ref.current
    const setRef = (value: unknown) => {ref.current = value ?? undefined}

    return [getRef, setRef]
} 

export default useRef

