import { isNumber } from "../type_check"
import { NonEmptyArray } from "./type"

export const isArray = (v: unknown) : v is Array<unknown> =>  Array.isArray(v)
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0
export const isNumberArray = (v: unknown) : v is Array<number> =>  Array.isArray(v) && v.every(v => isNumber(v))
