import { CSSUnitLength } from "src/css/units/lengths"
import { CSSObject, getCSSFunctionStr, getCSSPropertyStr, getCSSPropertyWithFunctionsStr, getCSSValueStr } from "../functions"

export type CSSLengthValue = {value: number, unit: CSSUnitLength}
export type CSSLengthValues = CSSLengthValue[]

export type CSSObjectWithLength<PK extends string, EV=never> = CSSObject<PK, CSSLengthValue | EV>

function map(values: CSSLengthValues) {
    return values.map(({value, unit}) => value + unit)
}

export function getCSSLengthValueStr(values: CSSLengthValues) {
    return getCSSValueStr(map(values))
}
export function getCSSPropertyWithLengthStr(name: string, values: CSSLengthValues) {
    return getCSSPropertyStr(name, map(values))
}
export function getCSSPropertyWithLengthKeyValue(name: string, values: CSSLengthValues) {
    return {[name]: getCSSLengthValueStr(values)}
}
export function getCSSFunctionWithLengthStr(name: string, values: CSSLengthValues) {
    return getCSSFunctionStr(name, map(values))
}
export function getCSSPropertyWithFunctionsWithLengthStr(name: string, fnNamesValues: [string, CSSLengthValues][]) {
    return getCSSPropertyWithFunctionsStr(name, fnNamesValues.map(([fnName, fnValues]) => [fnName, map(fnValues)]))
}