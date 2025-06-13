"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCSSTranslateFunctionStr = exports.getCSSTranslateStr = void 0;
function getCSSTranslateStr(translate, justValue) {
}
exports.getCSSTranslateStr = getCSSTranslateStr;
function getCSSTranslateFunctionStr(translate) {
    let str = "translate(";
    str += translate.x.value + translate.x.unit;
    str += ")";
    return str;
}
exports.getCSSTranslateFunctionStr = getCSSTranslateFunctionStr;
