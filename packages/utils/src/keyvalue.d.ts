import { KeyValue } from "./types_checks";
export declare const isEmpty: (kv: KeyValue) => boolean;
export declare const exist: <KV extends KeyValue>(kv: KV | null | undefined) => kv is KV;
export declare const writableProperty: <KV extends KeyValue>(kv: KV, key: keyof KV) => boolean;
