import { CSSObjectWithLength } from "./functions"

export type CSSTranslateKey = "x" | "y" | "z"
export type CSSTranslate<TK extends CSSTranslateKey="x" | "y">= CSSObjectWithLength<TK>
export type PartialCSSTranslate<TK extends CSSTranslateKey="x" | "y">= Partial<CSSTranslate<TK>>

export function getCSSTranslateStr<T extends CSSTranslate<CSSTranslateKey>, JV extends boolean>(translate: T, justValue: JV) {
    

}
export function getCSSTranslateFunctionStr<T extends CSSTranslate, F extends boolean>(translate: T) {
    let str = "translate("

    str += translate.x.value + translate.x.unit
    

    str += ")"

    return str
}
