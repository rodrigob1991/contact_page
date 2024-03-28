import { CSSUnitLength } from "./units/lengths";
export type SizeCSSContentRelative = "fit-content" | "max-content" | "min-content";
export type SizeCSSKey = "height" | "width";
export type SizeCSSValue = `${number}${CSSUnitLength | "%"}` | SizeCSSContentRelative;
export type SizeCSS = {
    [K in SizeCSSKey]: SizeCSSValue;
};
export type PartialSizeCSS = Partial<SizeCSS>;
