import { isArray } from "../array/type_check"
import { isCallable } from "../function/type_check"
import { isNumber } from "../number/type_check"
import { isString } from "../string/type_check"
import { KeyValue } from "./type"
import { isKeyValue, isPropertyKey } from "./type_check"

export function has<K>(this: KeyValue, k: K): this is KeyValue<K extends PropertyKey ? K : never> { return isPropertyKey(k) && k in this }
export type Has = typeof has

export function hasOwn<K>(this: KeyValue, k: K): this is KeyValue<K extends PropertyKey ? K : never> { return isPropertyKey(k) && this.hasOwnProperty(k) }
export type HasOwn = typeof hasOwn

export function map<KV extends KeyValue, CRV, CR extends [PropertyKey, CRV] | CRV, T extends "array" | "keyvale" | undefined>(this: KV, callback: <K extends keyof KV>(k: K, v: KV[K]) => CR, to?: T): KeyValue<string, unknown> {
    let mappedResult 
    let fill
    if (to === "array") {
        mappedResult = []
        fill = (mappedResult as unknown[]).push.bind(mappedResult)
    } else {
        mappedResult = create()
        fill = (k: string, v: unknown) => (mappedResult as KeyValue<string, unknown>)[k] = v
    }

    for (const k in this) {
        const v = this[k]
        const r = callback(k, v)
       fill(callback(kv))
    }
    return mappedResult
}
type Map = typeof map

export const basePrototype = {
    has,
    hasOwn,
    map
}
type BasePrototype = typeof basePrototype

export type Prototyped<KV extends KeyValue> = KV & BasePrototype

const isPropertyDescriptor = (value: unknown): value is PropertyDescriptor => true

export const create = <KV extends KeyValue>(kv?: KV) => Object.create(basePrototype, map.call(kv, (key, value) => [key, isPropertyDescriptor(value) ? value : {value}]))

export type CombineProperties<KV extends KeyValue, KF extends PropertyKey, AF, RF> = Prototyped<KV> & {[K in KF]: (this: KeyValue, ...args: AF[]) => RF}

export const createCombineProperties = <KV extends KeyValue, KF extends PropertyKey, AF, RF>(kv: KV, kf: KF, fn: (cum: RF | undefined, value: unknown) => RF) =>
    ({
        __proto__: prototype1,
        ...kv,
        [kf](this: KeyValue, ...args: AF[]) {
            let combined
            for (const key in this) {
                const value = this[key]
                if (isKeyValue(value) && kf in value) {
                    const targetValue = (isCallable(value[kf]) ? value[kf](args) : value[kf])
                    combined = fn(combined, targetValue)
                }
            }
            return combined
        }
    }) as CombineProperties<KV, KF, AF, RF>

