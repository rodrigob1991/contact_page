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
export type Seek<ST, T extends [unknown, unknown], D=never, DI extends boolean=true> = T extends [infer F, infer S]
        ? DI extends false 
            ? [ST] extends [F]
                ? S
                : D extends never ? ST : D
        : ST extends F
            ? S
            : D extends never ? ST : D
        : D extends never ? ST : D

// this type use to indicate that the type should be narrowed.
export type NarrowThis<T> = T

export type ExtractPredicateType<F> = F extends (arg: unknown, ...args: unknown[]) => arg is infer T ? T : never

export type PickIfEquals<X, Y, A=X, B=never> =
    (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? A : B


