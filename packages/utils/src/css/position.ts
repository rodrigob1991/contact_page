import { CSSUnitLength } from "./units/lengths"

export type PositionCSSKey = "top" | "left" | "right" | "bottom"
export type PositionCSSValue = `${number}${CSSUnitLength | "%"}` | "0"
export type PositionCSS = {[K in PositionCSSKey] : PositionCSSValue}
export type PartialPositionCSS = Partial<PositionCSS>

//export const getPositionCSS = <PK extends PositionCSSKey, UL extends CSSUnitLength="px">(numbers: {[K in PK]: number}, lengthUnit?: UL) => Object.fromEntries(Object.entries<number>(numbers).map(([k, v]) => [k, v + (lengthUnit ?? "px")])) as {[K in PK]: `${number}${UL}`}


