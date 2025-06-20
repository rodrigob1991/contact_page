export type IntegerNumber = number & { __brand: "integer_number" }
export type NumberInRange<F extends number, T extends number> = number & { __brand: "number_in_range" }
export type PositiveNumber = NumberInRange<0, number>
export type NegativeNumber = NumberInRange<number, -1>
export type IntegerNumberInRange<F extends IntegerNumber, T extends IntegerNumber> = NumberInRange<F, T> & IntegerNumber
export type PositiveIntegerNumber = PositiveNumber & IntegerNumber
export type NegativeIntegerNumber = NegativeNumber & IntegerNumber

export type KeyValue<K extends PropertyKey=PropertyKey, V=unknown>= Record<K, V>
export type EmptyKeyValue = KeyValue<never, never>
export type KeyNumberValue<K extends PropertyKey=PropertyKey, V extends number=number> = KeyValue<K, V>

export type Callable<A extends unknown[]=[], R=unknown> = (...args: A) => R

export type NonEmptyArray<T> = [T, ...T[]]

export const isNumber = (v: unknown) : v is number => typeof v === "number"
export const isIntegerNumber = (v: unknown) : v is IntegerNumber => isNumber(v) && Number.isInteger(v)
export const isNumberInRange = <F extends number, T extends number>(v: unknown, f: F | undefined, t: T | undefined) : v is NumberInRange<F, T> => isNumber(v) && (f ? v >= f : true) && (t ? v <= t : true)
export const isPositiveNumber = (v: unknown) : v is PositiveNumber => isNumberInRange(v, 0, undefined)
export const isNegativeNumber = (v: unknown) : v is NegativeNumber => isNumberInRange(v, undefined, -1)
export const isIntegerNumberInRange = <F extends IntegerNumber, T extends IntegerNumber>(v: unknown, f: F | undefined, t: T | undefined) : v is IntegerNumberInRange<F, T> => isNumberInRange(v, f, t) && Number.isInteger(v)
export const isPositiveIntegerNumber = (v: unknown) : v is PositiveIntegerNumber => isIntegerNumberInRange(v, 0 as IntegerNumber, undefined)
export const isNegativeIntegerNumber = (v: unknown) : v is NegativeIntegerNumber => isIntegerNumberInRange(v, undefined, -1 as IntegerNumber)

export const isString = (v: unknown) : v is string => typeof v === "string"

export const isKeyValue = (v: unknown) : v is KeyValue => typeof v === "object" && !isArray(v) && v !== null
export const isKeyNumberValue = (v: unknown) : v is KeyNumberValue => isKeyValue(v) && Object.values(v).every(v => isNumber(v))

export const isCallable = (v: unknown) : v is Callable => typeof v === "function" && !v.toString().startsWith("class")

export const isArray = (v: unknown) : v is Array<unknown> =>  Array.isArray(v)
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0
export const isNumberArray = (v: unknown) : v is Array<number> =>  Array.isArray(v) && v.every(v => isNumber(v))

