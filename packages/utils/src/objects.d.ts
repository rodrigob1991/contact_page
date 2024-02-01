import { ChangePropertiesType } from "./types";
export declare const getObjectWithNewProps: <O extends object, P extends [keyof O, any][]>(object: O, newProps: P) => ChangePropertiesType<O, P>;
export declare const isEmpty: (o: object) => boolean;
export declare const exist: <O extends object>(o: O | null | undefined) => o is O;
