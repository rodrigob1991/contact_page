export type Integer = number & { __brand: "integer" }
export type NumberRange<F extends number, T extends number> = number & { __brand: "numberRange" }
export type IntegerNumberRange<F extends Integer, T extends Integer> = Integer & { __brand: "numberRange" }

export type KeyValue<K extends PropertyKey=PropertyKey, V=unknown>= Record<K, V>
export type EmptyKeyValue = KeyValue<never, never>
export type KeyNumberValue<K extends PropertyKey=PropertyKey, V extends number=number> = KeyValue<K, V>

export type Callable<A extends unknown[]=[], R=unknown> = (...args: A) => R

export type NonEmptyArray<T> = [T, ...T[]]

export const isNumber = (v: unknown) : v is number => typeof v === "number"
export const isInteger = (v: unknown) : v is Integer => typeof v === "number" && Number.isInteger(v)
export const isNumberRange = <F extends number, T extends number>(v: unknown, f: F | undefined, t: T | undefined) : v is NumberRange<F, T> => typeof v === "number" && (f ? v >= f : true) && (t ? v <= t : true)
export const isIntegerNumberRange = <F extends Integer, T extends Integer>(v: unknown, f: F | undefined, t: T | undefined) : v is IntegerNumberRange<F, T> => isNumberRange(v, f, t) && Number.isInteger(v)

export const isString = (v: unknown) : v is string => typeof v === "string"

export const isKeyValue = (v: unknown) : v is KeyValue => typeof v === "object" && !isArray(v) && v !== null
export const isKeyNumberValue = (v: unknown) : v is KeyNumberValue => isKeyValue(v) && Object.values(v).every(v => isNumber(v))

export const isCallable = (v: unknown) : v is Callable => typeof v === "function" && !v.toString().startsWith("class")

export const isArray = (v: unknown) : v is Array<unknown> =>  Array.isArray(v)
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0
export const isNumberArray = (v: unknown) : v is Array<number> =>  Array.isArray(v) && v.every(v => isNumber(v))

