"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n = exports.getValueProducer = exports.cssDimensionTypes = exports.cssNumericValuesProducers = exports.cssKeywordsValues = exports.cssWideKeywordsValues = void 0;
//TODO: maybe use descriptive key names instead.
exports.cssWideKeywordsValues = {
    inherit: "inherit",
    initial: "initial",
    unset: "unset",
    revert: "revert",
    revertLayer: "revert-layer",
    unsetLayer: "unset-layer"
};
exports.cssKeywordsValues = {
    inline: "inline",
    scroll: "scroll",
    fixed: "fixed",
    local: "local",
    block: "block",
    listItem: "list-item",
    inlineBlock: "inline-block",
    left: "left",
    right: "right",
    top: "top",
    bottom: "bottom",
    center: "center",
    justify: "justify",
    invert: "invert",
    thin: "thin",
    medium: "medium",
    thick: "thick",
    collapse: "collapse",
    separate: "separate",
};
exports.cssNumericValuesProducers = {
    number: (n) => `${n}`,
    integer: (n) => `${Number.isInteger(n) ? n : Math.floor(n)}`,
    dimension: (n, u) => `${n}${u}`,
    percentage: (n) => `${n}%`
};
//export type CSSNumericValue<K extends CSSNumericValueKey> = 
exports.cssDimensionTypes = {
    time: (n, u) => `${n}${u}`,
    length: (n, u) => `${n}${u}`,
    frequency: (n, u) => `${n}${u}`,
    angle: (n, u) => `${n}${u}`,
};
const getValueProducer = () => {
    const producer = () => { };
    return producer;
};
exports.getValueProducer = getValueProducer;
exports.n = 34;
