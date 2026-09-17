import { CSSUnitLength } from "src/css/units/lengths";
import { CSSObject } from "../base";
export type CSSLengthValue = {
    value: number;
    unit: CSSUnitLength;
};
export type CSSLengthValues = CSSLengthValue[];
export type CSSObjectWithLength<PK extends string, EV = never> = CSSObject<PK, CSSLengthValue | EV>;
export declare function getCSSLengthValueStr(values: CSSLengthValues): any;
export declare function getCSSPropertyWithLengthStr(name: string, values: CSSLengthValues): any;
export declare function getCSSPropertyWithLengthKeyValue(name: string, values: CSSLengthValues): {
    [x: string]: any;
};
export declare function getCSSFunctionWithLengthStr(name: string, values: CSSLengthValues): any;
export declare function getCSSPropertyWithFunctionsWithLengthStr(name: string, fnNamesValues: [string, CSSLengthValues][]): any;
