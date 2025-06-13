import { CaseType } from "./types";
import { NonEmptyArray } from "./types_checks";
export declare const getContainedString: (str: string, betweenLeft?: string, betweenRight?: string) => string;
export declare const isEmpty: (str: string | undefined | null) => boolean;
export declare const getIndexOnOccurrence: (str: string, search: string, occurrence: number, reverse?: boolean) => number;
type RecursiveSplitResult<S extends (NonEmptyArray<string>)> = S extends [infer F, ...infer R] ? R extends (NonEmptyArray<string>) ? RecursiveSplitResult<R>[] : string[] : never;
export declare const recursiveSplit: <S extends NonEmptyArray<string>>(str: string, separators: S) => RecursiveSplitResult<S>;
export declare const getNumbers: (str: string) => number[];
export declare const getNumber: (str: string) => number | undefined;
export declare const upperCaseFirstChar: <S extends string>(str: S) => Capitalize<S>;
export declare const defaultStartWord: string[];
export declare const defaultBodyWord: string[];
/**
 * @param str the string from which to match the words
 * @param to case type to form the returned string
 * @param [startWord] strings that can be the start of a word, could have rgx format, defaults: "[A-Z]" y "[a-z]"
 * @param [bodyWord] strings that can be the body of a word, could have rgx format, defaults: "[a-z]"
 * @returns words matched from str turned into a string in the "to" param case type format
 */
export declare const toCase: (str: string, to: CaseType, startWord?: string[], bodyWord?: string[]) => string;
export {};
