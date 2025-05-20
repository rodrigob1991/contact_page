export type KeyValue<K extends PropertyKey=PropertyKey, V=unknown>= Record<K, V>
export type EmptyKeyValue = KeyValue<never, never>
export type KeyNumberValue<K extends PropertyKey=PropertyKey, V extends number=number> = KeyValue<K, V>
export type Callable<A extends unknown[]=[], R=unknown> = (...args: A) => R
export type NonEmptyArray<T> = [T, ...T[]]

export const isNumber = (v: unknown) : v is number => typeof v === "number"
export const isString = (v: unknown) : v is string => typeof v === "string"
export const isKeyValue = (v: unknown) : v is KeyValue => typeof v === "object" && !isArray(v) && v !== null
export const isCallable = (v: unknown) : v is Callable => typeof v === "function" && !v.toString().startsWith("class")
export const isArray = (v: unknown) : v is Array<unknown> =>  Array.isArray(v)
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0
export const isNumberArray = (v: unknown) : v is Array<number> =>  Array.isArray(v) && v.every(v => isNumber(v))
export const isKeyNumberValue = (v: unknown) : v is KeyNumberValue => isKeyValue(v) && Object.values(v).every(v => isNumber(v))
