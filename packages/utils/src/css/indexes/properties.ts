import { CamelOrPascalToKebab } from "src/types"
import { toCase } from "../../strings"
import { CSSKeywords, LengthPercentage, LineWidth, ValueProducer, ValueProducerResult, valueProducer } from "./values"
import { KeyValue } from "src/types_checks"

export const cssPropertiesProducer = {
    borderWidth: valueProducer as ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: valueProducer as ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: valueProducer as ValueProducer<[a: LengthPercentage]>,
    width: valueProducer as ValueProducer<[a: LengthPercentage]>
} as const

type KeyArgs<K extends CSSPropertyKey=CSSPropertyKey> = K extends CSSPropertyKey ? [K, CSSPropertyArgs<K>] : never
type KeysArgs<KL extends CSSPropertyKey[]=CSSPropertyKey[]> = KL extends [infer K extends CSSPropertyKey, ...infer R extends CSSPropertyKey[]] ? [[K, CSSPropertyArgs<K>], ...KeysArgs<R>] : KeyArgs<KL[number]>[]

export type CSSPropertyStr<KA extends KeyArgs> = KA extends KeyArgs ? `${CamelOrPascalToKebab<KA[0]>}: ${ValueProducerResult<KA[1]>};` : never
export type CSSPropertiesStr<KA extends KeysArgs> = KA extends [infer F extends KeyArgs, ...infer R extends KeysArgs] ? `${CSSPropertyStr<F>}${CSSPropertiesStr<R>}` : KA extends [] ? "" : string
export const getCssPropertiesStr = <KA extends KeysArgs>(...keysArgs: KA) => {
    let str = ""
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        str += `${toCase(key, "kebab")}: ${value};`
    }
    return str as CSSPropertiesStr<KA>
}

export type CSSPropertiesKeyValue<KA extends KeysArgs> = KA extends [infer F extends KeyArgs, ...infer R extends KeysArgs] ? {[K in F[0]]: ValueProducerResult<F[1]>} & CSSPropertiesKeyValue<R> : KA extends [] ? {} : KeyValue<KA[number][0], ValueProducerResult<KA[number][1]>>
export const getCssPropertiesKeyValue = <KA extends KeysArgs>(...keysArgs: KA) => {
    const keyValue: Partial<CSSPropertiesKeyValue<KA>> = {}
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        keyValue[key] = value
    }
    return keyValue as CSSPropertiesKeyValue<KA>
}

export type CSSPropertiesProducer = typeof cssPropertiesProducer
export type CSSPropertyKey = keyof CSSPropertiesProducer
export type CSSPropertyArgs<K extends CSSPropertyKey=CSSPropertyKey> = Parameters<CSSPropertiesProducer[K]>

