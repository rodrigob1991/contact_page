import { CSSUnitLengthValue } from "../../units/lengths"

export type CSSPositionKey = "top" | "left" | "right" | "bottom"
export type CSSPosition = {[K in CSSPositionKey] : CSSUnitLengthValue}
export type PartialCSSPosition= Partial<CSSPosition>

//export const getPositionCSS = <PK extends PositionCSSKey, UL extends CSSUnitLength="px">(numbers: {[K in PK]: number}, lengthUnit?: UL) => Object.fromEntries(Object.entries<number>(numbers).map(([k, v]) => [k, v + (lengthUnit ?? "px")])) as {[K in PK]: `${number}${UL}`}


