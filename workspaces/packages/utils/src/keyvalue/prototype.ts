import { isArray } from "../array/type_check";
import { isCallable } from "../function/type_check";
import { KeyValue } from "./type"
import { isKeyValue } from "./type_check";

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

export const getCombinePropertiesPrototype = (rkey: PropertyKey, fn: (cum: unknown, value: unknown) => unknown) => Object.create(
    {
        [rkey](this: KeyValue, ...args: unknown[]) {
            let cumulative
            for (const key in this) {
                const value = this[key]
                if (isKeyValue(value) && rkey in value) {
                    const targetValue = value[rkey]
                    cumulative = fn(cumulative, isCallable(targetValue) ? targetValue(args) : targetValue)
                }
            }
            return cumulative
        }
    }
) 


