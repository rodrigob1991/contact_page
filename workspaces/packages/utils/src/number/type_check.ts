import { IntegerNumber, IntegerNumberInRange, NegativeIntegerNumber, NegativeNumber, NumberInRange, PositiveIntegerNumber, PositiveNumber } from "./type";

export const isNumber = (v: unknown) : v is number => typeof v === "number"
export const isIntegerNumber = (v: unknown) : v is IntegerNumber => Number.isInteger(v)
export const isNumberInRange = <F extends number, T extends number>(v: unknown, f: F | undefined, t: T | undefined) : v is NumberInRange<F, T> => isNumber(v) && (f ? v >= f : true) && (t ? v <= t : true)
export const isPositiveNumber = (v: unknown) : v is PositiveNumber => isNumberInRange(v, 0, undefined)
export const isNegativeNumber = (v: unknown) : v is NegativeNumber => isNumberInRange(v, undefined, -1)
export const isIntegerNumberInRange = <F extends IntegerNumber, T extends IntegerNumber>(v: unknown, f: F | undefined, t: T | undefined) : v is IntegerNumberInRange<F, T> => isNumberInRange(v, f, t) && Number.isInteger(v)
export const isPositiveIntegerNumber = (v: unknown) : v is PositiveIntegerNumber => isIntegerNumberInRange(v, 0 as IntegerNumber, undefined)
export const isNegativeIntegerNumber = (v: unknown) : v is NegativeIntegerNumber => isIntegerNumberInRange(v, undefined, -1 as IntegerNumber)
