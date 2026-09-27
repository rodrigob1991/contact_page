import { Increment, Seek } from "../type";
import { KeyValue } from "../type_check";

export type NonEmptyArray<T> = [T, ...T[]]

export type ReadOnlyOrMutableArray<T> = (readonly T[]) | T[]

// T = [] => never; T = any[] => number; T = [string, number] => 1 | 2
export type ArrayIndex<A extends unknown[], I extends number[]=number[]> =
    A["length"] extends 0
        ? never 
        : I["length"] extends A["length"]
            ? I[number]
            : ArrayIndex<A, [...I, I["length"]]>

export type ChangeElements<A extends unknown[], T extends [unknown, unknown]> = A extends [infer E0, ...infer ER extends unknown[]] ? [Seek<E0, T>, ...ChangeElements<ER, T>] : A[number] extends never ? [] : Seek<A[number], T>[]

export type RemoveElements<A extends unknown[], R> = A extends [infer E0, ...infer ER extends unknown[]] ? [...[Seek<E0, [R, never]>], ...RemoveElements<ER, R>] : A[number] | Seek<A[number], [R, never]> extends never ? [] : Seek<A[number], [R, never]>[]

// TODO: when T include unions types like boolean then the result could be undesired. Try to fix this using other type parameter type
export type MembersCombinations<T, U = T> = [T] extends [never]
  ? []
  : T extends U
  ? [T, ...MembersCombinations<Exclude<U, T>>]
  : never

export type ElementsMembersCombinations<A extends unknown[]> = A extends [infer F, ...infer R] 
  ? F extends unknown 
  ? [F, ...ElementsMembersCombinations<R>]
  : never
  : []

export type KeyValueTuple<KV extends KeyValue> = {
    [K in keyof KV]: [K, KV[K]]
}[keyof KV]

export type Sized<L extends number, T=unknown, A extends T[]=[]> = A["length"] extends L ? number extends L ? T[] : A : Sized<L, T, [...A, T]>

export type Flat<A extends unknown[]> = A extends [infer F, ...infer R]
    ? [...(F extends unknown[] ? Flat<F> : [F]), ...Flat<R>]
    : []

export type Matrix<D extends number[], V=unknown> = D extends [infer F extends number, ...infer R extends number[]]
    ? Sized<F, R extends [] ? V : Matrix<R>>
    : D extends [] ? [] : V[]

export type Slice<A extends unknown[], S extends number, E extends number=A["length"], I extends number=0, B=true> =
    A extends [infer F, ...infer R]
        ? B extends true 
            ? I extends S 
                ? [F, ...Slice<R, S, E, Increment<I>, false>]
                : Slice<R, S, E, Increment<I>>
            : I extends E
                ? [F] 
                : [F, ...Slice<R, S, E, Increment<I>, false>]
        : []
