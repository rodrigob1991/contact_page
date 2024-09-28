//TODO: ORDER THE TYPES IN THE DIFFERENT SECTIONS, OBJECTS, ARRAYS ....

export type EqualTypes<T0, T1> = T0 extends T1 ? T1 extends T0 ? T0 : never : never

// -------Objects---------

export type EmptyObject = Record<PropertyKey, never>

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
export type ChangePropertiesType<O extends object, NewTypes extends [keyof O, unknown][]> = {
    [Key in keyof O]
    : SeekNewType<Key, NewTypes> extends undefined
        ? O[Key]
        : SeekNewType<Key, NewTypes>
}
export type ChangePropertyType<O extends object, NewType extends [keyof O, unknown]> = ChangePropertiesType<O, [NewType]>

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

// if the first type of each tuple of I extends T then the second element of the tuple will be part of the union result, never otherwise
export type IfFirstExtendsThenSecond<T, I extends [unknown, unknown][]> = I extends [infer FI extends [unknown, unknown],  ...infer RI extends [unknown, unknown][]] ?  (FI[0] extends T ? FI[1] : never) | IfFirstExtendsThenSecond<T, RI> : never
// if one member of the first type of each tuple of I extends T then the second element of the tuple will be part of the union result, never otherwise
export type IfOneOfFirstExtendsThenSecond<T, I extends [unknown, unknown][]> = I extends [infer FI extends [unknown, unknown],  ...infer RI extends [unknown, unknown][]] ? IfOneExtends<FI[0], T, FI[1]> | IfOneOfFirstExtendsThenSecond<T, RI> : never

// if one element from "U" extends "IN" then the result is "IF", otherwise is "ELSE"
export type IfOneExtends<U, IN, IF, ELSE = never> = IF extends { [K in U as ""]: K extends IN ? IF : never }[""] ? IF : ELSE

// if all elements from "U" extends "IN" then the result is "IF", otherwise is "ELSE"
export type IfExtends<U, IN, IF, ELSE = never> = false extends { [K in U as ""]: K extends IN ? true : false }[""] ? ELSE : IF

// if one elements from "U" not extends "IN" then the result is "IF", otherwise is "ELSE"
export type IfOneNotExtends<U, IN, IF, ELSE = never> = IfExtends<U, IN, ELSE, IF>

// if all elements from "U" not extends "IN" then the result is "IF", otherwise is "ELSE"
export type IfNotExtends<U, IN, IF, ELSE = never> = IfOneExtends<U, IN, ELSE, IF>

export type IfAllPropertiesIn<P extends object, IN extends object, IF, Else={}> = P extends IN ? IF : Else 

export type NonEmptyArray<T> = [T, ...T[]]
export const isNonEmpty = <T>(a: T[]): a is NonEmptyArray<T> => a.length > 0

export type ChangeKeysNames<O extends object, NewKeysNames extends [keyof O, PropertyKey][]> = {[K in keyof O as SeekNewType<K, NewKeysNames> extends infer V ? V extends PropertyKey ? V : K : never]: O[K]}
export type ChangeKeyName<O extends object, NewKeyName extends [keyof O, PropertyKey]> = ChangeKeysNames<O, [NewKeyName]>

export type Available<T, U, A extends object> = T extends U ? A : {[K in keyof A]?: never}

//--------------------------

// -------ARRAYS---------

export type ReadOnlyOrMutableArray<T> = (readonly T[]) | T[]

// T = [] => never; T = any[] => number; T = [string, number] => 1 | 2
export type ArrayIndex<A extends unknown[], I extends number[]=number[]> =
    A["length"] extends 0
        ? never 
        : I["length"] extends A["length"]
            ? I[number]
            : ArrayIndex<A, [...I, I["length"]]>

type ChangeType<E, T extends [unknown, unknown][]> = T extends [infer T0 extends [unknown, unknown], ...infer TR extends [unknown, unknown][]] ? T0[0] extends E ? Exclude<E, T0[0]> | T0[1] : ChangeType<E, TR> : E
export type ChangeArrayTypes<A extends unknown[], T extends [unknown, unknown][]> = A extends [infer E0, ...infer ER extends unknown[]] ? [ChangeType<E0, T>, ...ChangeArrayTypes<ER, T>] : ChangeType<A[number], T>[]

//--------------------------
