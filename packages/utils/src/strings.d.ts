import { NonEmptyArray } from "./types";
export declare const getContainedString: (str: string, betweenLeft?: string, betweenRight?: string) => string;
export declare const isEmpty: (str: string | undefined | null) => boolean;
export declare const getIndexOnOccurrence: (str: string, search: string, occurrence: number, reverse?: boolean) => number;
type RecursiveSplitResult<S extends (NonEmptyArray<string>)> = S extends [infer F, ...infer R] ? R extends (NonEmptyArray<string>) ? RecursiveSplitResult<R>[] : string[] : never;
export declare const recursiveSplit: <S extends NonEmptyArray<string>>(str: string, separators: S) => RecursiveSplitResult<S>;
export declare const getNumbers: (str: string) => number[];
export {};
