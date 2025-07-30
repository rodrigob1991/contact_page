import { toCase } from "../../strings"
import { CSSKeywords, LengthPercentage, LineWidth, ValueProducer, valueProducer } from "./values"

export const cssPropertiesProducer = {
    borderWidth: valueProducer as ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: valueProducer as ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: valueProducer as ValueProducer<[a: LengthPercentage]>,
    width: valueProducer as ValueProducer<[a: LengthPercentage]>
} as const

type KeyArgs<K extends CSSPropertyKey> = K extends CSSPropertyKey ? [K, CSSPropertyArgs<K>] : never
type KeysArgs<KL extends CSSPropertyKey[]=CSSPropertyKey[]> = KL extends [infer K extends CSSPropertyKey, ...infer R extends CSSPropertyKey[]] ? [[K, CSSPropertyArgs<K>], ...KeysArgs<R>] : KeyArgs<KL[number]>[]

export type CSSPropertiesStr<K extends CSSPropertyKey=CSSPropertyKey> = {
    [OK in K]: ReturnType<CSSPropertiesProducer[OK]>
}
export const getCssPropertiesStr = <KA extends KeysArgs>(...keysArgs: KA) => {
    let str = ""
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        str += `${toCase(key, "kebab")}: ${value};`
    }
    return str as CSSPropertiesStr<KA>
}

export type CSSPropertiesKeyValue<K extends CSSPropertyKey=CSSPropertyKey> = {
    [OK in K]: ReturnType<CSSPropertiesProducer[OK]>
}
export const getCssPropertiesKeyValue = <KA extends KeysArgs>(...keysArgs: KA) => {
    const keyValue: Partial<CSSPropertiesKeyValue> = {}
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        keyValue[key] = value
    }
    return keyValue as CSSPropertiesKeyValue<KA>
}

export type CSSPropertiesProducer = typeof cssPropertiesProducer
export type CSSPropertyKey = keyof CSSPropertiesProducer
export type CSSPropertyArgs<K extends CSSPropertyKey=CSSPropertyKey> = Parameters<CSSPropertiesProducer[K]>

