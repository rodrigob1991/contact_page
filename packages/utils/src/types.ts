import { Callable, KeyValue } from "./types_checks"

// Types are order by the result type.

// -------Any types---------

export type EqualTypes<T0, T1> = T0 extends T1 ? T1 extends T0 ? T0 : never : never

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

export type IfObjectExtends<P extends object, IN extends object, IF, Else={}> = P extends IN ? IF : Else 

export type IfUndefinedOtherExtends<T, IO, IU=undefined>= IfFirstExtendsThenSecond<T, [[undefined, IU], [Exclude<T, undefined> extends never ? 1 : Exclude<T, undefined>, IO]]>

export type IfTrueFalseExtends<T extends boolean, IT, IF>= IfFirstExtendsThenSecond<T, [[true, IT], [false, IF]]>

// ----------------

// -------String---------

export type CaseType = "camel" | "pascal" | "kebab" | "snake"

// TODO: change this type for one that take a string and a CaseType and return the string turn into the CaseType.
export type CamelOrPascalToKebab<S extends string, B extends boolean=true> = S extends `${infer F}${infer R}`
  ? F extends Uppercase<F>
        ? B extends true 
            ?  `${Lowercase<F>}${CamelOrPascalToKebab<R, false>}`
            : `-${Lowercase<F>}${CamelOrPascalToKebab<R, false>}`
    : `${F}${CamelOrPascalToKebab<R, false>}`
  : ""

export type InterpolateType = string | number | bigint | boolean | null | undefined

export type InterpolateElements<A extends InterpolateType[], S extends InterpolateType =""> = A extends [infer F extends InterpolateType, ...infer R extends InterpolateType[]]
  ? R extends []
    ? `${F}`
    : `${F}${S}${InterpolateElements<R>}`
  : A extends [] 
    ? "" 
    : string

export type InterpolateKeyValue<KV extends KeyValue<PropertyKey, InterpolateType>, B extends InterpolateType="", M extends InterpolateType="", E extends InterpolateType="">= {
    [K in keyof KV]: `${B}${K extends symbol ? K["description"] : K}${M}${KV[K]}${E}`
}[keyof KV]

export type InterpolateKeysValues<KV extends KeyValue<PropertyKey, InterpolateType>, B extends InterpolateType="", M extends InterpolateType="", E extends InterpolateType="">= InterpolateElements<AllCombinations<InterpolateKeyValue<KV, B, M, E>>>

// ----------------------

// -------Objects---------

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


export type Writable<O extends object> = {
    -readonly [K in keyof O]: O[K]
}
export type ExtractWritable<O extends object> = {
    [K in keyof O as PickIfEquals<{ [Q in K]: O[K] }, { -readonly [Q in K]: O[K] }, K>]: O[K]
}
export type ExtractReadonly<O extends object> = {
    [P in keyof O]-?: PickIfEquals<{ [Q in P]: O[P] }, { -readonly [Q in P]: O[P] }, never, P>
}[keyof O]

export type PropertiesUnion<O extends object> = Exclude<{
    [K in keyof O]: { [K1 in K] : O[K] }
}[keyof O], undefined>

export type PropertiesUnionRecursive<O extends object> = Exclude<{
    [K in keyof O]: { [K1 in K]: O[K] extends object ? PropertiesUnionRecursive<O[K]> : O[K]}
}[keyof O], undefined>

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

type ChangeType<E, T extends [unknown, unknown][]> = T extends [infer T0 extends [unknown, unknown], ...infer TR extends [unknown, unknown][]] ? E  extends T0[0] ? Exclude<E, T0[0]> | T0[1] : ChangeType<E, TR> : E
export type ChangeElementsType<A extends unknown[], T extends [unknown, unknown][]> = A extends [infer E0, ...infer ER extends unknown[]] ? [ChangeType<E0, T>, ...ChangeElementsType<ER, T>] : ChangeType<A[number], T>[]
// TODO: when T include unions types like boolean then the result could be undesired. Try to fix this using other type parameter type
export type AllCombinations<T, U = T> = [T] extends [never]
  ? []
  : T extends U
  ? [T, ...AllCombinations<Exclude<U, T>>]
  : never

//--------------------------

// -------FUNCTIONS(Callable)---------

export type CallableReturnUnion<C extends Callable, JR> = C extends (...args: infer A) => infer R ? (...args: A) => R | JR : never
//export type CallableUnion<T, A extends [unknown, Callable][]> = A extends [infer FA extends [unknown, Callable],  ...infer RA extends [unknown, Callable][]] ? (FA[0] extends T ? FA[1] : never) | FunctionUnion<T, RA> : never
//export type FunctionUnionAccumulateArgs<T, A extends [unknown, [unknown[], unknown]][], AINE extends boolean=true, LA extends unknown[]=[]> = A extends [infer FA extends [unknown, [unknown[], unknown]],  ...infer RA extends [unknown, [unknown[], unknown]][]] ? FA[0] extends  T ? ((...args: [...LA, ...FA[1][0]]) => FA[1][1]) | FunctionUnionAccumulateArgs<T, RA, AINE, [...LA, ...FA[1][0]]> : FunctionUnionAccumulateArgs<T, RA, AINE, true extends AINE ? [...LA, ...FA[1][0]] : LA> : never

//--------------------------
