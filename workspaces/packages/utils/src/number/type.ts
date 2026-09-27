// TODO: subtract to the result the negatives elements in "N" and result to "number" if any element in N is "number".

import { Flat, Matrix, Sized } from "../array/type"

export type IntegerNumber = number & { __brand: "integer_number" }
export type NumberInRange<F extends number | undefined= undefined, T extends number | undefined= undefined> = number & { __brand: "number_in_range" }
export type PositiveNumber = NumberInRange<0>
export type NegativeNumber = NumberInRange<undefined, -1>
export type IntegerNumberInRange<F extends IntegerNumber, T extends IntegerNumber> = NumberInRange<F, T> & IntegerNumber
export type PositiveIntegerNumber = PositiveNumber & IntegerNumber
export type NegativeIntegerNumber = NegativeNumber & IntegerNumber

// "N" need to be integer.
export type Sum<N extends number[], A extends unknown[]=[]> = 
    N extends [infer F extends number, ...infer R extends number[]] 
        ? Sum<R, [...A, ...Sized<F>]> 
        : N extends [] 
            ? A["length"] 
            : number
// TODO: add sign to the result and result to "number" if any element in N is "number".
// "N" need to be integer.
export type Multiply<N extends number[]> = Flat<Matrix<N>>["length"]
export type ToNegative<N extends number> = `-${N}` extends `${infer R extends number}` ? R : never
export type ToPositive<N extends number> = `${N}` extends `-${infer R extends number}` ? R : N
export type Increment<N extends number, A extends number=1> = Sum<[N, A]>
