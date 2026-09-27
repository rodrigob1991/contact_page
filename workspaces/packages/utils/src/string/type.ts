import { ElementsMembersCombinations, MembersCombinations } from "../array/type"
import { KeyValue } from "../keyvalue/type"

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
