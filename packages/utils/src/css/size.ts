import { CSSUnitLength } from "./units/lengths"

export type SizeCSSContentRelative = "fit-content" | "max-content" | "min-content"
export type SizeCSSKey = "height" | "width"
export type SizeCSSValue = `${number}${CSSUnitLength | "%"}` | SizeCSSContentRelative
export type SizeCSS = {[K in SizeCSSKey] : SizeCSSValue}
export type PartialSizeCSS = Partial<SizeCSS>

//export const getSizeCSS = <SK extends SizeCSSKey, UL extends CSSUnitLength="px">(numbers: {[K in SK]: number}, lengthUnit?: UL) => Object.fromEntries(Object.entries<number>(numbers).map(([k, v]) => [k, v + (lengthUnit ?? "px")])) as {[K in SK]: `${number}${UL}`}
