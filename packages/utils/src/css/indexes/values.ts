import { CSSUnit, CSSUnitAngle, CSSUnitFrequency, CSSUnitLength, CSSUnitTime } from "./units"

//TODO: maybe use descriptive key names instead.
export const cssWideKeywordsValues = {
    inherit: "inherit",
    initial: "initial",
    unset: "unset",
    revert: "revert",
    revertLayer: "revert-layer",
    unsetLayer: "unset-layer"
} as const

export const cssKeywordsValues = {
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

export const cssNumericValuesProducers = {
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

export const getValueProducer = () => {
    const producer = () => {}

    return producer
}

export type Int = number & { __brand: 'int' }
export const n : Int = 34
