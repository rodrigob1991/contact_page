import { CamelOrPascalToKebab, Slice, Sum } from "src/types"
import { toCase } from "../../strings"
import { CSSKeywords, CSSValue, LengthPercentage, LineWidth, ValueProducer, ValueProducerResult, valueProducer } from "./values"
import { KeyValue } from "src/types_checks"

/* const cssPropertiesData = {
    borderWidth: ["none", ["all", "medium" as LineWidth, 0, "topBottom", "medium" as LineWidth, 1, "top", "medium" as LineWidth, 2], ["leftRight", "medium" as LineWidth, 2 , "right", "medium" as LineWidth, 1], ["bottom", "medium" as LineWidth, 1], ["left", "medium" as LineWidth, 0]],
    translate: ["none", ["x", "0px" as LengthPercentage, 3], ["y", "0px" as LengthPercentage, 2], ["z", "0px" as LengthPercentage, 1]]
} as const */

const cssPropertiesData = {
    border: {
        width: {
            _value: "medium" as LineWidth,
            _keys: [["all"], ["topBottom", "leftRight"], ["top", "leftRight", "bottom"], ["top", "bottom", "left", "right"]],
            top: {},
            bottom: {},
            left: {},
            right: {}
        },
    },
    translate: {
        _value: "0px" as LengthPercentage,
        _keys: [["x"], ["x", "y"], ["x", "y", "z"]]
    },
} as const

export type CSSPropertiesData = typeof cssPropertiesData
export type CSSPropertiesDataKey = keyof CSSPropertiesData
export type CSSPropertyKey<TK extends string="", D extends KeyValue=CSSPropertiesData, DK extends keyof D =keyof D> = DK extends infer K extends keyof D & string ? K extends `_${string}` ? never : D[K] extends infer ND extends KeyValue ? `${TK}${TK extends "" ? K : Capitalize<K>}` extends infer NTK extends string ? NTK | CSSPropertyKey<NTK, ND> : never : never : never

type PropertyArgMemberData = [PropertyKey, CSSValue, number]
type PropertyArgData = PropertyArgMemberData[number][]
type PropertyArgsData = PropertyArgData[]

type PropertyArgsMember<PADT extends PropertyArgMemberData, PAD extends PropertyArgsData, CL extends number[]=[]> = 
    {[K in PADT[0]]: PADT[1]} & 
    Slice<CL, 1> extends infer CLS extends number[] 
        ? CLS["length"] extends PADT[2] 
            ? {} 
            : PAD extends [infer F extends PropertyArgData, ...infer R extends PropertyArgsData] 
                ? Slice<F, Sum<[CL[0], CLS["lenght"]]>> extends [infer K extends PropertyKey , infer T extends CSSValue, infer C extends number] 
                    ? PropertyArgsMember<[K, T, C], R, [Sum<CLS>]> & PropertyArgsMember<PADT, PAD, [...CL, C]> 
                    : never
                : never
        : never
type PropertyArgs<PAD extends PropertyArgsData, TC extends number = 0> = 
    PAD extends [infer F extends PropertyArgData, ...infer R extends PropertyArgsData] 
        ? F extends [infer K extends PropertyKey , infer T extends CSSValue, infer C extends number, ...infer RKTC extends PropertyArgData]
            ? PropertyArgsMember<[K, T, C], R, [TC]> | PropertyArgs<[RKTC, ...R], Sum<[TC, C]>> 
            : never
        : never

export type CSSProperties = {
    [K in CSSPropertyKey]: CSSPropertiesData[K] extends readonly[infer F, ...infer R] ? F | PropertyArgs<R> : never
}
const getPropertyValueStr = <K extends CSSPropertyKey, A extends CSSProperties[K]>(key: K, args: A) => {
    

}

/* export type CSSPropertiesProducer = {
    borderWidth: ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: ValueProducer<[a: LengthPercentage]>,
    width: ValueProducer<[a: LengthPercentage]>
}
 */
/* export const cssPropertiesProducer: CSSPropertiesProducer = {
    borderWidth: valueProducer,
    translate: valueProducer,
    height: valueProducer,
    width: valueProducer
} as const */

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


