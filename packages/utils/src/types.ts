export type ChangePropertiesType<O extends object, NewTypes extends [keyof O, unknown][]> = {
    [Key in keyof O]
    : SeekNewType<Key, NewTypes> extends undefined
        ? O[Key]
        : SeekNewType<Key, NewTypes>
}
export type ChangePropertyType<O extends object, NewType extends [keyof O, unknown]> = ChangePropertiesType<O, [NewType]>

type SeekNewType<SearchKey, NewTypes extends [PropertyKey, unknown][]> =
    NewTypes extends [infer NewType, ...infer Rest]
        ? NewType extends [PropertyKey, unknown]
            ? SearchKey extends NewType[0]
                ? NewType[1]
                : Rest extends [PropertyKey, unknown][]
                    ? SeekNewType<SearchKey, Rest>
                    : never
            : never
        : undefined

type PickIfEquals<X, Y, A=X, B=never> =
    (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? A : B

export type ExtractWritableProps<O extends object> = {
    [K in keyof O as PickIfEquals<{ [Q in K]: O[K] }, { -readonly [Q in K]: O[K] }, K>]: O[K]
}
type ReadonlyKeys<T> = {
    [P in keyof T]-?: PickIfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T]

export  type AnyPropertiesCombination<O extends object> = {
    [K in keyof O]: { [key in K]: O[K] }
}[keyof O]
export type AnyPropertiesCombinationRecursive<O extends object> = {
    [K in keyof O]: { [key in K]: O[K] extends object ? AnyPropertiesCombinationRecursive<O[K]> : O[K]}
}[keyof O]

// if one element from "U" is in "IN" then the result is "IF", otherwise is "ELSE"
export type IfOneIn<U extends PropertyKey, IN extends PropertyKey, IF, ELSE = never> = IF extends { [K in U]: K extends IN ? IF : never }[U] ? IF : ELSE

// if all elements from "U" are in "IN" then the result is "IF", otherwise is "ELSE"
export type IfAllIn<U extends PropertyKey, IN extends PropertyKey, IF, ELSE = never> = false extends { [K in U]: K extends IN ? true : false }[U] ? ELSE : IF

// if one elements from "U" is not in "IN" then the result is "IF", otherwise is "ELSE"
export type IfOneNotIn<U extends PropertyKey, IN extends PropertyKey, IF, ELSE = never> = IfAllIn<U, IN, ELSE, IF>

// if all elements from "U" are not in "IN" then the result is "IF", otherwise is "ELSE"
export type IfAllAreNotIn<U extends PropertyKey, IN extends PropertyKey, IF, ELSE = never> = IfOneIn<U, IN, ELSE, IF>

export type NonEmptyArray<T> = [T, ...T[]]
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0

