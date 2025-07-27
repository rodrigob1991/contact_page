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

// if all members of ST extends T[0] then T[1] member of result, D type parameter otherwise.
export type Seek<ST, T extends [unknown, unknown], DI extends boolean=false> = T extends [infer F, infer S]
        ? DI extends false 
            ? [ST] extends [F]
                ? S
                : ST
        : ST extends F
            ? S
            : ST
        : ST

/* export type SeekType<SearchKey, NewTypes extends [unknown, unknown][]> =
    NewTypes extends [infer NewType extends [unknown, unknown], ...infer Rest]
            ? SearchKey extends NewType[0]
                ? NewType[1]
                : Rest extends [unknown, unknown][]
                    ? SeekType<SearchKey, Rest>
                    : never
            : never */

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

export type InterpolateElements<A extends InterpolateType[], S extends InterpolateType ="", INS=never, AU=ElementsMembersCombinations<A>> = AU extends [infer F extends InterpolateType, ...infer R extends InterpolateType[]]
  ? R extends []
    ? `${F}`
    : `${F}${F extends INS ? "" : R[number] extends INS ? "" : S}${InterpolateElements<R, S, INS>}`
  : A extends [] 
    ? "" 
    : string

export type InterpolateKeyValue<KV extends KeyValue<PropertyKey, InterpolateType>, B extends InterpolateType="", M extends InterpolateType="", E extends InterpolateType="">= {
    [K in keyof KV]: `${B}${K extends symbol ? K["description"] : K}${M}${KV[K]}${E}`
}[keyof KV]

export type InterpolateKeysValues<KV extends KeyValue<PropertyKey, InterpolateType>, B extends InterpolateType="", M extends InterpolateType="", E extends InterpolateType="">= InterpolateElements<MembersCombinations<InterpolateKeyValue<KV, B, M, E>>>

// ----------------------

// -------Objects---------

export type ChangePropertiesValues<O extends object, T extends [keyof O, unknown]> = {
    [K in keyof O] : Seek<K, T, O[K]>
}

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

export type ChangeKeys<O extends object, NK extends [keyof O, PropertyKey]> = {[K in keyof O as Seek<K, NK>]: O[K]}

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

export type ChangeElements<A extends unknown[], T extends [unknown, unknown]> = A extends [infer E0, ...infer ER extends unknown[]] ? ER extends [] ? [Seek<E0, T, E0>] : [Seek<E0, T, E0>, ...ChangeElements<ER, T>] : A[number] extends never ? [] : Seek<A[number], T, >[]

export type RemoveElements<A extends unknown[], R> = A extends [infer E0, ...infer ER extends unknown[]] ? ER extends [] ? IfExtends<E0, R, [], []> [ChangeType<E0, T>] : [ChangeType<E0, T>, ...ChangeElementsType<ER, T>] : ChangeType<A[number], T>[]

// TODO: when T include unions types like boolean then the result could be undesired. Try to fix this using other type parameter type
export type MembersCombinations<T, U = T> = [T] extends [never]
  ? []
  : T extends U
  ? [T, ...MembersCombinations<Exclude<U, T>>]
  : never

export type ElementsMembersCombinations<A extends unknown[]> = A extends [infer F, ...infer R] 
  ? F extends unknown 
  ? [F, ...ElementsMembersCombinations<R>]
  : never
  : []

export type KeyValueTuple<KV extends KeyValue> = {
    [K in keyof KV]: [K, KV[K]]
}[keyof KV]
//--------------------------

// -------FUNCTIONS(Callable)---------

export type CallableReturnUnion<C extends Callable, JR> = C extends (...args: infer A) => infer R ? (...args: A) => R | JR : never
//export type CallableUnion<T, A extends [unknown, Callable][]> = A extends [infer FA extends [unknown, Callable],  ...infer RA extends [unknown, Callable][]] ? (FA[0] extends T ? FA[1] : never) | FunctionUnion<T, RA> : never
//export type FunctionUnionAccumulateArgs<T, A extends [unknown, [unknown[], unknown]][], AINE extends boolean=true, LA extends unknown[]=[]> = A extends [infer FA extends [unknown, [unknown[], unknown]],  ...infer RA extends [unknown, [unknown[], unknown]][]] ? FA[0] extends  T ? ((...args: [...LA, ...FA[1][0]]) => FA[1][1]) | FunctionUnionAccumulateArgs<T, RA, AINE, [...LA, ...FA[1][0]]> : FunctionUnionAccumulateArgs<T, RA, AINE, true extends AINE ? [...LA, ...FA[1][0]] : LA> : never

//--------------------------
