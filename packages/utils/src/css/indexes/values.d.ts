import { CSSUnit, CSSUnitAngle, CSSUnitFrequency, CSSUnitLength, CSSUnitTime } from "./units";
export declare const cssWideKeywordsValues: {
    readonly inherit: "inherit";
    readonly initial: "initial";
    readonly unset: "unset";
    readonly revert: "revert";
    readonly revertLayer: "revert-layer";
    readonly unsetLayer: "unset-layer";
};
export declare const cssKeywordsValues: {
    readonly inline: "inline";
    readonly scroll: "scroll";
    readonly fixed: "fixed";
    readonly local: "local";
    readonly block: "block";
    readonly listItem: "list-item";
    readonly inlineBlock: "inline-block";
    readonly left: "left";
    readonly right: "right";
    readonly top: "top";
    readonly bottom: "bottom";
    readonly center: "center";
    readonly justify: "justify";
    readonly invert: "invert";
    readonly thin: "thin";
    readonly medium: "medium";
    readonly thick: "thick";
    readonly collapse: "collapse";
    readonly separate: "separate";
};
export declare const cssNumericValuesProducers: {
    number: <N extends number>(n: N) => `${N}`;
    integer: <N_1 extends number>(n: N_1) => `${number}`;
    dimension: <N_2 extends number, U extends CSSUnit>(n: N_2, u: U) => `${N_2}${U}`;
    percentage: <N_3 extends number>(n: N_3) => `${N_3}%`;
};
export type CSSNumericValuesProducers = typeof cssNumericValuesProducers;
export type CSSNumericValueKey = keyof CSSNumericValuesProducers;
export declare const cssDimensionTypes: {
    time: <N extends number, U extends CSSUnitTime>(n: N, u: U) => `${N}${U}`;
    length: <N_1 extends number, U_1 extends CSSUnitLength>(n: N_1, u: U_1) => `${N_1}${U_1}`;
    frequency: <N_2 extends number, U_2 extends CSSUnitFrequency>(n: N_2, u: U_2) => `${N_2}${U_2}`;
    angle: <N_3 extends number, U_3 extends CSSUnitAngle>(n: N_3, u: U_3) => `${N_3}${U_3}`;
};
export declare const getValueProducer: () => () => void;
export type Int = number & {
    __brand: 'int';
};
export declare const n: Int;
