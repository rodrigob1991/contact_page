type RecordWithNumber<KN extends string> = {
    [K in KN]: number;
};
type RecordWithString<KN extends string> = {
    [K in KN]: string;
};
type Direction = "ascendant" | "descendant";
export declare const orderByCounting: <K extends string, R extends RecordWithNumber<K>[] | RecordWithString<K>[]>(array: R, key: K, getIndex: (v: R[number][K]) => number, direction?: Direction) => R;
export declare const orderByComparePreviousByNumber: <K extends string, R extends RecordWithNumber<K>[]>(records: R, key: K, direction?: Direction) => R;
export declare const orderByComparePreviousByString: <K extends string, R extends RecordWithString<K>[]>(records: R, key: K, direction?: Direction) => R;
export {};
