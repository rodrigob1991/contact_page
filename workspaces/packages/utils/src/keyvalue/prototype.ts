import { isArray } from "../array/type_check"
import { isCallable } from "../function/type_check"
import { isNumber } from "../number/type_check"
import { isString } from "../string/type_check"
import { IfOneOfFirstExtendsThenSecond } from "../type"
import { FromUnionElements, KeyValue } from "./type"
import { isKeyValue, isPropertyKey } from "./type_check"

export function has<K>(this: KeyValue, k: K): this is KeyValue<K extends PropertyKey ? K : never> { return isPropertyKey(k) && k in this }
export type Has = typeof has

export function hasOwn<K>(this: KeyValue, k: K): this is KeyValue<K extends PropertyKey ? K : never> { return isPropertyKey(k) && this.hasOwnProperty(k) }
export type HasOwn = typeof hasOwn

type MapTo = "array" | "keyvalue" | undefined
type MapCallbackResult<T extends MapTo=MapTo> = IfOneOfFirstExtendsThenSecond<T, [["array", unknown], ["keyvalue" | undefined, [PropertyKey, unknown]]]>
type MapCallback<KV extends KeyValue, R extends MapCallbackResult> = <K extends keyof KV>(k: K, v: KV[K]) => R
type MapResult<T extends MapTo, CR extends MapCallbackResult<T>> = IfOneOfFirstExtendsThenSecond<T, [["array", CR[]], ["keyvalue" | undefined, FromUnionElements<CR extends MapCallbackResult<"keyvalue" | undefined> ? CR : never>]]>
export function map<KV extends KeyValue, MT extends MapTo, MCR extends MapCallbackResult<MT>>(this: KV, callback: MapCallback<KV, MCR>, to?: MT): MapResult<MT, MCR> {
    let mappedResult
    let fill: (cr: MCR) => void
    if (to === "array") {
        mappedResult = []
        fill = (cr) => { mappedResult.push(cr) }
    } else {
        mappedResult = create()
        fill = (cr) => {
            if (isArray(cr) && cr.length === 2 && isPropertyKey(cr[0])) 
                mappedResult[cr[0]] = cr[1] 
        }
    }
    for (const k in this) {
       fill(callback(k, this[k]))
    }
    return mappedResult
}
type Map = typeof map

export const r = map.call({a: 1, b: 2}, (k, v) => [k, v]) // {a: 2, b: 4}

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

