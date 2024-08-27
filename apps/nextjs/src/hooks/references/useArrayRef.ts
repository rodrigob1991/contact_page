import { useRef as useReactRef } from "react"
import { ArrayIndex, IfExtends } from "utils/src/types"

type ArrayWithoutNulls<A extends unknown[]> = ChangeArrayTypes<A, [[null, undefined]]>
type GetArray<A extends unknown[]> = () => ArrayWithoutNulls<A>
type SetElement<A extends unknown[], E=A[number]> = (element: E | IfExtends<E, [[null, undefined], [undefined, null]]>, index: ArrayIndex<A>) => void
type UseArrayRefReturn<A extends unknown[]> = [GetArray<A>, SetElement<A>]

const useArrayRef = function  <A extends unknown[]>(initArray?: A): UseArrayRefReturn<A> {
    const arrayRef = useReactRef<ArrayWithoutNulls<A>>(initArray ? initArray.map(e => e ?? undefined) : [])
    const getArray = () => arrayRef.current
    const setElement: SetElement<A> = (element, index) => {
        arrayRef.current[index] = element ?? undefined
    }

    return [getArray, setElement]
} 

export default useArrayRef
