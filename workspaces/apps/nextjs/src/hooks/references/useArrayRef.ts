import { useRef as useReactRef } from "react"
import { ArrayIndex, ChangeArrayTypes, IfExtends } from "utils/src/types"

type ArrayWithoutNulls<A extends unknown[]> = ChangeArrayTypes<A, [[null, undefined]]>
type GetArray<A extends unknown[]> = () => ArrayWithoutNulls<A>
type SetElement<A extends unknown[]> = <I extends ArrayIndex<A>, E=A[I]>(element: E | IfExtends<E, [[null, undefined], [undefined, null]]>, index: I) => void
type UseArrayRefReturn<A extends unknown[]> = [GetArray<A>, SetElement<A>]

const useArrayRef = function <A extends unknown[]>(initArray?: A): UseArrayRefReturn<A> {
    type AWN = ArrayWithoutNulls<A>
    const arrayRef = useReactRef<AWN>((initArray ? initArray.map(e => e ?? undefined) : []) as AWN)
    const getArray = () => arrayRef.current
    const setElement: SetElement<A> = (element, index) => {
        arrayRef.current[index] = (element ?? undefined) as AWN[typeof index]
    }

    return [getArray, setElement]
} 

export default useArrayRef
