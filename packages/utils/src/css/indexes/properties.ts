import { toCase } from "../../strings"
import { valueProducer, LineWidth, ValueProducer, CSSKeywords, LengthPercentage } from "./values"

export const cssPropertiesProducer = {
    borderWidth: valueProducer as ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: valueProducer as ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: valueProducer as ValueProducer<[a: LengthPercentage]>,
    width: valueProducer as ValueProducer<[a: LengthPercentage]>
} as const

export const v = cssPropertiesProducer.borderWidth("4px")

type KeyArgs<K extends CSSPropertyKey> = K extends CSSPropertyKey ? [K, CSSPropertyArgs<K>] : never
type KeysArgs<KL extends CSSPropertyKey[]> = KL extends [infer K extends CSSPropertyKey, ...infer R extends CSSPropertyKey[]] ? [[K, CSSPropertyArgs<K>], ...KeysArgs<R>] : KeyArgs<KL[number]>[]

export const getCssPropertiesStr = <KL extends CSSPropertyKey[], KA extends KeysArgs<KL>>(keysArgs: KA) => {
    let str = ""
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        str += `${toCase(key, "kebab")}: ${value};`
    }
    return str
}

export const getCssPropertiesKeyValue = <KL extends CSSPropertyKey[], KA extends KeysArgs<KL>>(keysArgs: KA) => {
    const keyValue: Partial<CSSPropertiesKeyValue> = {}
    for (const [key, args] of keysArgs) {
        const value = cssPropertiesProducer[key](...args)
        keyValue[key] = value
    }
    return keyValue
}

export type CSSPropertiesProducer = typeof cssPropertiesProducer
export type CSSPropertyKey = keyof CSSPropertiesProducer
export type CSSPropertyArgs<K extends CSSPropertyKey=CSSPropertyKey> = Parameters<CSSPropertiesProducer[K]>
export type CSSPropertiesKeyValue<K extends CSSPropertyKey=CSSPropertyKey> = {
    [OK in K]: ReturnType<CSSPropertiesProducer[OK]>
}
