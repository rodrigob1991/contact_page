import {ChangePropertiesType} from "./types"
import { KeyValue } from "./types_checks"

/** 
 * @return shallow copy of the kv param with replaced properties with newProps param provided
 * */
export const getObjectWithNewProps = <KV extends KeyValue, P extends [keyof KV, unknown][]>(kv: KV, newProps: P): ChangePropertiesType<KV, P> => {
    const modifiedKv: ChangePropertiesType<KV, P> = {...kv}
    for (const [key, newProp] of newProps) {
        modifiedKv[key] = newProp
    }
    return modifiedKv
}

export const isEmpty = (kv: KeyValue) => Object.keys(kv).length === 0
export const exist = <KV extends KeyValue>(kv: KV | null | undefined): kv is KV => kv !== undefined && kv !== null
export const writableProperty = <KV extends KeyValue>(kv: KV, key: keyof KV) => Object.getOwnPropertyDescriptor(kv, key)?.writable ?? false