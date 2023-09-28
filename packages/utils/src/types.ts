export type ChangePropertiesType<R extends Record<string, any>, NewTypes extends [keyof R & string, any][]> = {
    [Key in keyof R]
    : SeekNewType<Key, NewTypes> extends undefined
        ? R[Key]
        : SeekNewType<Key, NewTypes>
}
export type ChangePropertyType<R extends Record<string, any>, NewType extends [keyof R & string, any]> = ChangePropertiesType<R, [NewType]>

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

