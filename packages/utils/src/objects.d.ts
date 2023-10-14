import { ChangePropertiesType } from "./types";
export declare const getObjectWithNewProps: <O extends object, P extends [keyof O, any][]>(object: O, newProps: P) => ChangePropertiesType<O, P>;
export declare const isEmpty: (object: object) => boolean;
