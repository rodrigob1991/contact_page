import { CSSObjectWithLength } from "./functions"

export type CSSSizeContentRelative = "fit-content" | "max-content" | "min-content"
export type CSSSizeKey = "height" | "width"
export type CSSSize<SK extends CSSSizeKey=CSSSizeKey>= CSSObjectWithLength<SK, CSSSizeContentRelative>
export type PartialCSSSize<SK extends CSSSizeKey=CSSSizeKey> = Partial<CSSSize<SK>>

//export const getSizeCSS = <SK extends SizeCSSKey, UL extends CSSUnitLength="px">(numbers: {[K in SK]: number}, lengthUnit?: UL) => Object.fromEntries(Object.entries<number>(numbers).map(([k, v]) => [k, v + (lengthUnit ?? "px")])) as {[K in SK]: `${number}${UL}`}
