export type ChangePropertiesType<Object extends Record<string, any>, NewTypes extends [keyof Object & string, any][]> = {
    [Key in keyof Object]
    : SeekNewType<Key, NewTypes> extends undefined
        ? Object[Key]
        : SeekNewType<Key, NewTypes>
}

type SeekNewType<SearchKey, NewTypes extends [string, any][]> =
    NewTypes extends [infer NewType, ...infer Rest]
        ? NewType extends [string, any]
            ? SearchKey extends NewType[0]
                ? NewType[1]
                : Rest extends [string, any][]
                    ? SeekNewType<SearchKey, Rest>
                    : never
            : never
        : undefined

type PickIfEquals<X, Y, A=X, B=never> =
    (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? A : B

export type ExtractWritableProps<R extends Record<string, any>> = {
    [K in keyof R as PickIfEquals<{ [Q in K]: R[K] }, { -readonly [Q in K]: R[K] }, K>]: R[K]
}
type ReadonlyKeys<T> = {
    [P in keyof T]-?: PickIfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T]

export  type AnyPropertiesCombination<R extends Record<string, any>> = {
    [K in keyof R]: { [key in K]: R[K] }
}[keyof R]
export type AnyPropertiesCombinationRecursive<R extends Record<string, any>> = {
    [K in keyof R]: { [key in K]: R[K] extends Record<string, any> ? AnyPropertiesCombinationRecursive<R[K]> : R[K]}
}[keyof R]
