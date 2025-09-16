import { CSSObjectWithLength } from "./functions";
export type CSSSizeContentRelative = "fit-content" | "max-content" | "min-content";
export type CSSSizeKey = "height" | "width";
export type CSSSize<SK extends CSSSizeKey = CSSSizeKey> = CSSObjectWithLength<SK, CSSSizeContentRelative>;
export type PartialCSSSize<SK extends CSSSizeKey = CSSSizeKey> = Partial<CSSSize<SK>>;
