import { NumberInRange, PositiveNumber } from "src/types_checks"
import { ChangeElementsType, InterpolateElements } from "../../types"
import { CSSUnitLength } from "./units"

//TODO: maybe use descriptive key names instead.
export const cssWideKeywords = {
    inherit: "inherit",
    initial: "initial",
    unset: "unset",
    revert: "revert",
    revertLayer: "revert-layer",
    unsetLayer: "unset-layer"
} as const
export type CSSWideKeywords = typeof cssWideKeywords
export type CSSWideKeywordKey = keyof CSSWideKeywords
export type CSSWideKeywordValue = CSSWideKeywords[CSSWideKeywordKey]

export const cssKeywords = {
    none: "none",
    inline: "inline",
    scroll:  "scroll",
    fixed: "fixed", 
    local: "local",
    block: "block",
    listItem: "list-item",
    inlineBlock: "inline-block",
    left: "left",
    right: "right",
    top: "top",
    bottom: "bottom",
    center: "center",
    justify: "justify",
    invert: "invert",
    thin: "thin",
    medium: "medium",
    thick: "thick",
    collapse: "collapse",
    separate: "separate",
} as const
export type CSSKeywords = typeof cssKeywords
export type CSSKeywordKey = keyof CSSKeywords
export type CSSKeywordsValues = CSSKeywords[CSSKeywordKey]

export type Length<N extends NumberInRange=NumberInRange, U extends CSSUnitLength | ""=CSSUnitLength | ""> = `${N}${U}`
export type PositiveLength<N extends PositiveNumber=PositiveNumber> = Length<N>
export type Percentage<N extends NumberInRange=NumberInRange> = `${N}%`
export type LengthPercentage = Length | Percentage
export type LineWidth = PositiveLength | CSSKeywords["thin" | "medium" | "thick"]

export type CSSValue = LengthPercentage | LineWidth

/* export const cssNumericValuesProducers = {
    number: <N extends number>(n: N) => `${n}` as const,
    integer: <N extends number>(n: N) => `${Number.isInteger(n) ? n : Math.floor(n)}` as const,
    dimension: <N extends number, U extends CSSUnit>(n: N, u: U) => `${n}${u}` as const,
    percentage: <N extends number>(n: N) => `${n}%` as const
}
export type CSSNumericValuesProducers = typeof cssNumericValuesProducers
export type CSSNumericValueKey = keyof CSSNumericValuesProducers
//export type CSSNumericValue<K extends CSSNumericValueKey> = 

export const cssDimensionTypes = {
    time: <N extends number, U extends CSSUnitTime>(n: N, u: U) => `${n}${u}` as const,
    length: <N extends number, U extends CSSUnitLength>(n: N, u: U) => `${n}${u}` as const,
    frequency: <N extends number, U extends CSSUnitFrequency>(n: N, u: U) => `${n}${u}` as const,
    angle: <N extends number, U extends CSSUnitAngle>(n: N, u: U) => `${n}${u}` as const,
}
 */
export type T = ChangeElementsType<["none"], [[undefined, ""]]>
export const U:  [string, ...string[]] = ["string"]
type ValueProducerResult<V extends (CSSValue | undefined)[] | [CSSWideKeywordValue | CSSKeywordsValues]> = InterpolateElements<ChangeElementsType<V, [[undefined, ""]]>, " ">
export type ValueProducer<V extends (CSSValue | undefined)[], KK extends CSSKeywordKey=never> = <A extends V | [CSSWideKeywordValue | CSSKeywords[KK]]>(...args: A) => ValueProducerResult<A>
export const valueProducer: ValueProducer<(CSSValue | undefined)[]> = (...args) => args.filter(v => v).join(" ") as ValueProducerResult<typeof args>
