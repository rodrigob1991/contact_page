import { isArray } from "../array/type_check"
import { isCallable } from "../function/type_check"
import { KeyValue } from "./type"
import { isKeyValue } from "./type_check"

type Has = <K extends PropertyKey>(k: K) => this is KeyValue<K>
type Prototype1 = {
    has: Has
    hasOwn: Has
}

export const prototype1: Prototype1 = {
    has(k): this is KeyValue<typeof k> {
        return k in this
    },
    hasOwn(k): this is KeyValue<typeof k> {
        return this.hasOwnProperty(k)
    },
}

export type Prototyped<KV extends KeyValue> = KV & Prototype1

export const create = <KV extends KeyValue | KeyValue<PropertyKey, PropertyDescriptor>>(kv: KV) => Object.create(prototype1, {"lo": {value: 4}}) 

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

