import { isArray } from "../array/type_check"
import { isNumber } from "../number/type_check"
import { isString } from "../string/type_check";
import { KeyNumberValue, KeyValue } from "./type"

export const isKeyValue = (v: unknown) : v is KeyValue => typeof v === "object" && v !== null && !isArray(v) 
export const isKeyNumberValue = (v: unknown) : v is KeyNumberValue => isKeyValue(v) && Object.values(v).every(v => isNumber(v))
export const isEmpty = (kv: KeyValue): kv is {} => Object.keys(kv).length === 0
export const writableProperty = <KV extends KeyValue>(kv: KV, key: keyof KV) => Object.getOwnPropertyDescriptor(kv, key)?.writable ?? false

export const isPropertyKey = (v: unknown): v is PropertyKey => isString(v) || isNumber(v) || typeof v === "symbol"