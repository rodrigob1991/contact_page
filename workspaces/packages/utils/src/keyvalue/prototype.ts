import { KeyValue } from "./type"

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

