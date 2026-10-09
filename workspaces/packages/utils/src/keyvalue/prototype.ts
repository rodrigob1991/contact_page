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

export function map<T, CR extends [PropertyKey, T] | T>(this: KeyValue, callback: (value: unknown, key: string) => CR): KeyValue<string, unknown> {
type Map = typeof map

type BasePrototype = {
    has: Has
    hasOwn: HasOwn
    map: Map
}


export const basePrototype: BasePrototype = {
    has,
    hasOwn,
    map
}

export type Prototyped<KV extends KeyValue> = KV & BasePrototype

const isPropertyDescriptor = (value: unknown): value is PropertyDescriptor => true

export const create = <KV extends KeyValue | KeyValue<PropertyKey, PropertyDescriptor>>(kv: KV) => Object.create(prototype1, kv.map((value, key) => isPropertyDescriptor(value) ? [key, value] : [key, {value}]) as PropertyDescriptorMap)

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

