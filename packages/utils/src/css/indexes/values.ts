import { NumberInRange, PositiveNumber } from "src/types_checks"
import { ChangeElements, InterpolateElements } from "../../types"
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
export type LengthPercentage<N extends NumberInRange=NumberInRange> = Length<N> | Percentage<N>
export type LineWidth = PositiveLength | CSSKeywords["thin" | "medium" | "thick"]

export type CSSValue = LengthPercentage | LineWidth

export type ValueProducerResult<V extends (CSSValue | undefined)[] | [CSSWideKeywordValue | CSSKeywordsValues]> = InterpolateElements<ChangeElements<V, [undefined, ""]>, " ", "">
export type ValueProducer<V extends (CSSValue | undefined)[], KK extends CSSKeywordKey=never> = <A extends V | [CSSWideKeywordValue | CSSKeywords[KK]]>(...args: A) => ValueProducerResult<A>
export const valueProducer: ValueProducer<(CSSValue | undefined)[]> = (...args) => args.filter(v => v).join(" ") as ValueProducerResult<typeof args>
