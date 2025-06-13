import { CSSObjectWithLength } from "./functions";
export type CSSTranslateKey = "x" | "y" | "z";
export type CSSTranslate<TK extends CSSTranslateKey = "x" | "y"> = CSSObjectWithLength<TK>;
export type PartialCSSTranslate<TK extends CSSTranslateKey = "x" | "y"> = Partial<CSSTranslate<TK>>;
export declare function getCSSTranslateStr<T extends CSSTranslate<CSSTranslateKey>, JV extends boolean>(translate: T, justValue: JV): void;
export declare function getCSSTranslateFunctionStr<T extends CSSTranslate, F extends boolean>(translate: T): string;
