import { ChangePropertiesType } from "./types";
export declare const getRecordWithNewProps: <R extends Record<string, any>, P extends [keyof R & string, any][]>(record: R, newProps: P) => ChangePropertiesType<R, P>;
