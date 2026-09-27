export const prototype1 = {
    has<K extends PropertyKey>(k: K): this is { [K1 in K]: unknown } {
        return Object.prototype.hasOwnProperty.call(this, k)
    }
}

