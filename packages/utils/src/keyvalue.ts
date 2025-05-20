import { KeyValue } from "./types_checks"

export const isEmpty = (kv: KeyValue) => Object.keys(kv).length === 0
export const exist = <KV extends KeyValue>(kv: KV | null | undefined): kv is KV => kv !== undefined && kv !== null
export const writableProperty = <KV extends KeyValue>(kv: KV, key: keyof KV) => Object.getOwnPropertyDescriptor(kv, key)?.writable ?? false
