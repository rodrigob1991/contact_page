import { CSSUnitLength } from "./units/lengths";
export type PositionCSSKey = "top" | "left" | "right" | "bottom";
export type PositionCSSValue = `${number}${CSSUnitLength | "%"}` | "0";
export type PositionCSS = {
    [K in PositionCSSKey]: PositionCSSValue;
};
export type PartialPositionCSS = Partial<PositionCSS>;
