import { CamelOrPascalToKebab } from "src/types"
import { toCase } from "../../strings"
import { CSSKeywords, CSSValue, LengthPercentage, LineWidth, ValueProducer, ValueProducerResult, valueProducer } from "./values"

const cssPropertiesData = {
    borderWidth: ["none", ["all", "topBottom", "top", "top", "medium" as LineWidth], ["leftRight", "leftRight", "right", "medium" as LineWidth], ["bottom", "bottom", "medium" as LineWidth], ["left", "medium" as LineWidth]],
    translate: ["none", ["x", "0px" as LengthPercentage, 3], ["y", "0px" as LengthPercentage, 2], ["z", "0px" as LengthPercentage, 1]]
} as const

export type CSSPropertiesData = typeof cssPropertiesData
export type CSSPropertyKey = keyof CSSPropertiesData

//type KeyValueArgs<LA extends [][]> = LA extends [infer F extends [], ...infer R extends [][]] ? F extends [infer K, infer T, infer C, ...infer RKTC] ? 
export type CSSProperties = {
    [K in CSSPropertyKey]: CSSPropertiesData[K] extends [infer F, ...infer R extends [][]] ? F | KeyValueArgs<R> : never
}
const getPropertyValueStr = <K extends CSSPropertyKey, A extends CSSProperties[K]>(key: K, args: A) => {
    

}
/* export type CSSPropertiesArgs = {
    borderWidth: [a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"],
    translate: [a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage],
    height: [a: LengthPercentage],
    width: [a: LengthPercentage]
} */

export type CSSPropertiesProducer = {
    borderWidth: ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: ValueProducer<[a: LengthPercentage]>,
    width: ValueProducer<[a: LengthPercentage]>
}

export const cssPropertiesProducer: CSSPropertiesProducer = {
    borderWidth: valueProducer,
    translate: valueProducer,
    height: valueProducer,
    width: valueProducer
} as const

type KeyArgsTuple<K extends CSSPropertyKey=CSSPropertyKey> = K extends CSSPropertyKey ? [K, CSSPropertyArgs<K>] : never
type KeyArgsTuples<KL extends CSSPropertyKey[]=CSSPropertyKey[]> = KL extends [infer K extends CSSPropertyKey, ...infer R extends CSSPropertyKey[]] ? [[K, CSSPropertyArgs<K>], ...KeyArgsTuples<R>] : KeyArgsTuple<KL[number]>[]

export type CSSPropertyStr<KAT extends KeyArgsTuple> = KAT extends KeyArgsTuple ? `${CamelOrPascalToKebab<KAT[0]>}: ${ValueProducerResult<KAT[1]>};` : never
export type CSSPropertiesStr<KATS extends KeyArgsTuples> = KATS extends [infer KAT extends KeyArgsTuple, ...infer KATSR extends KeyArgsTuples] ? `${CSSPropertyStr<KAT>}${CSSPropertiesStr<KATSR>}` : KATS extends [] ? "" : string
export const getCssPropertiesStr = <KATS extends KeyArgsTuples>(...keysArgs: KATS) => {
    let str = ""
    for (const [key, args] of keysArgs) {
        const value = valueProducer[key](...args)
        str += `${toCase(key, "kebab")}: ${value};`
    }
    return str as CSSPropertiesStr<KATS>
}

type KeyArgs<K extends CSSPropertyKey=CSSPropertyKey> = {[MK in K]: CSSPropertyArgs<MK>}

export type CSSPropertiesKeyValue<KA extends KeyArgs> = {[K in Extract<keyof KA, CSSPropertyKey>]: ValueProducerResult<KA[K]>}
export const getCssPropertiesKeyValue = <KA extends KeyArgs>(keyArgs: KA) => {
    const keyValue: Partial<CSSPropertiesKeyValue<KA>> = {}
    for (const key in keyArgs) {
        const value = cssPropertiesProducer[key](...keyArgs[key])
        keyValue[key] = value
    }
    return keyValue as CSSPropertiesKeyValue<KA>
}

//export type CSSPropertiesProducer = typeof cssPropertiesProducer

//export type CSSPropertyArgs<K extends CSSPropertyKey=CSSPropertyKey> = Parameters<CSSPropertiesProducer[K]>

type PropertyArgMemberData = [PropertyKey, CSSValue, number]
type PropertyArgData = PropertyArgMemberData[number][]
type PropertyArgsData = PropertyArgData[]
type PropertyArgsMember<PADT extends PropertyArgMemberData, PAD extends PropertyArgsData, CL extends number[]=[]> = {[K in PADT[0]]: PADT[1]} & CL["length"] extends PADT[2] ? {} : PAD extends [infer F extends [infer K extends PropertyKey, infer T extends CSSValue, infer C extends number, ...infer RKTC extends PropertyArgData], ...infer R extends PropertyArgsData] ? PropertyArgsMember<[K, T, C], R> & PropertyArgsMember<PADT, PAD, [...CL, 1]> : never
type PropertyArgs<PAD extends PropertyArgsData>= PAD extends [infer F extends [infer K extends PropertyKey , infer T extends CSSValue, infer C extends number, ...infer RKTC extends PropertyArgData], ...infer R extends PropertyArgsData] ? PropertyArgsMember<[K, T, C], R> | PropertyArgs<[RKTC, ...R]> : never
