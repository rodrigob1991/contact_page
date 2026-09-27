import { PickIfEquals, Seek } from "../type"

export type KeyValue<K extends PropertyKey=PropertyKey, V=unknown>= Record<K, V>
export type EmptyKeyValue = KeyValue<never, never>
export type KeyNumberValue<K extends PropertyKey=PropertyKey, V extends number=number> = KeyValue<K, V>

export type Writable<KV extends KeyValue> = {
    -readonly [K in keyof KV]: KV[K]
}
export type ExtractWritable<KV extends KeyValue> = {
    [K in keyof KV as PickIfEquals<{ [Q in K]: KV[K] }, { -readonly [Q in K]: KV[K] }, K>]: KV[K]
}
export type ExtractReadonly<KV extends KeyValue> = {
    [P in keyof KV]-?: PickIfEquals<{ [Q in P]: KV[P] }, { -readonly [Q in P]: KV[P] }, never, P>
}[keyof KV]

export type PropertiesUnion<KV extends KeyValue> = Exclude<{
    [K in keyof KV]: { [K1 in K] : KV[K] }
}[keyof KV], undefined>

export type PropertiesUnionRecursive<KV extends KeyValue> = Exclude<{
    [K in keyof KV]: { [K1 in K]: KV[K] extends KeyValue ? PropertiesUnionRecursive<KV[K]> : KV[K]}
}[keyof KV], undefined>

export type ChangeKeys<KV extends KeyValue, NK extends [keyof KV, PropertyKey]> = {[K in keyof KV as Seek<K, NK>]: KV[K]}

export type Available<T, U, A extends KeyValue> = T extends U ? A : {[K in keyof A]?: never}

export type FromElements<A extends unknown[]> = A extends [infer F, infer S, ...infer R] ? F extends PropertyKey ? KeyValue<F, S> : {} & FromElements<R> : A extends [] ? {} : KeyValue<Extract<A[number], PropertyKey>, A[number]>

export type ChangePropertiesValues<KV extends KeyValue, T extends [keyof KV, unknown]> = {
    [K in keyof KV] : Seek<K, T, KV[K]>
}

