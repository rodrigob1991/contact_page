import { KeyValueTuple } from "../array/type";
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

type MapTo = "array" | "keyvalue" 
type MapCallbackResult<T extends MapTo=MapTo> = IfOneOfFirstExtendsThenSecond<T, [["array", unknown], ["keyvalue", [PropertyKey, unknown]]]>
type MapCallback<KV extends KeyValue, R extends MapCallbackResult> = <K extends keyof KV>(k: K, v: KV[K]) => R
type MapResult<T extends MapTo=MapTo, CR extends MapCallbackResult<T>=MapCallbackResult<T>> = IfOneOfFirstExtendsThenSecond<T, [["array", CR[]], ["keyvalue", FromUnionElements<CR>]]>
/* export function map<KV extends KeyValue, CR extends MapCallbackResult<T>, T extends MapTo>(this: KV, callback: MapCallback<KV, CR>, to: T): MapResult<T, CR> {
    let mappedResult: MapResult<T, CR>
    let fill: (cr: CR) => void
    if (to === "array") {
        mappedResult = [] as MapResult<T, CR>
        fill = (cr) => { (mappedResult as MapResult<"array">).push(cr) }
    } else {
        mappedResult = create({})
        fill = (cr) => {
            if (isArray(cr) && cr.length === 2 && isPropertyKey(cr[0])) 
                (mappedResult as MapResult<"keyvalue">)[cr[0]] = cr[1] 
        }
    }
    for (const k in this) {
       fill(callback(k, this[k]))
    }
    return mappedResult
} */
export function map<KV extends KeyValue, CR extends  MapCallbackResult<"keyvalue">>(this: KV, callback: MapCallback<KV, CR>): MapResult<"keyvalue", CR> {
    let mappedResult: MapResult<"keyvalue", CR> = create({})
    for (const k in this) {
       const cr = callback(k, this[k])
       if (isArray(cr) && cr.length === 2 && isPropertyKey(cr[0])) 
                (mappedResult as MapResult<"keyvalue">)[cr[0]] = cr[1] 
    }
    return mappedResult
}
type Map = typeof map

export function mapToArray<KV extends KeyValue, CR extends  MapCallbackResult<"array">>(this: KV, callback: MapCallback<KV, CR>): MapResult<"array", CR> {
    let mappedResult: MapResult<"array", CR> = []
    for (const k in this) {
       mappedResult.push(callback(k, this[k]))
    }
    return mappedResult
}
type MapToArray = typeof mapToArray

export const basePrototype = {
    has,
    hasOwn,
    map,
    mapToArray
}
type BasePrototype = typeof basePrototype

export type Prototyped<KV extends KeyValue> = KV & BasePrototype

// specific for using in this context.
// maybe check for value type
const isPropertyDescriptor = (value: unknown): value is PropertyDescriptor => isKeyValue(value) && ("enumerable" in value || "configurable" in value || "writable" in value || "get" in value || "set" in value)
 
type CreateKV = KeyValue | KeyValueTuple[]
type MapToPropertyDescriptor<KV extends CreateKV> = KV extends KeyValueTuple[] ? {[K in KV[number][0]]: KV[number][1] extends PropertyDescriptor ? KV[number][1] : {value: KV[number][1]}} : {[K in keyof KV]: KV[K] extends PropertyDescriptor ? KV[K] : {value: KV[K]}}
export const create = <KV extends CreateKV, P extends KeyValue | undefined>(kv: KV, p?: P) => Object.create(p ?? basePrototype, map.call(isArray(kv) ? Object.fromEntries(kv) : kv, (key, value) => [key, isPropertyDescriptor(value) ? value : {value}]) as MapToPropertyDescriptor<KV>)

export type ValuesUnion<KV extends KeyValue, CK extends keyof KV> = {[K in keyof KV]: CK extends K ? KV[K] : KV[K] extends KeyValue ? ValuesUnion<KV[K], CK> : never}[keyof KV]
export type SharePropertyUnionCallback<R, V> = (lastResult: R | undefined, value: V) => R
export type SharePropertyUnion<KV extends CreateKV, KF extends PropertyKey, AF, RF> = Prototyped<KV> & {[K in KF]: (this: KeyValue, ...args: AF[]) => RF}
export const createSharePropertyUnion = <KV extends CreateKV, P extends KeyValue | undefined, KF extends PropertyKey, AF, RF>(kv: KV, kf: KF, callback: SharePropertyUnionCallback, p?: P) => {
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
}