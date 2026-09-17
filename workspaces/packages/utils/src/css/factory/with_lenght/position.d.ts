import { CSSUnitLengthValue } from "../../units/lengths";
export type CSSPositionKey = "top" | "left" | "right" | "bottom";
export type CSSPosition = {
    [K in CSSPositionKey]: CSSUnitLengthValue;
};
export type PartialCSSPosition = Partial<CSSPosition>;
