export type ChangePropertyType<T extends Record<string, any>, KeyToChangeType extends keyof  T,NewType> = {
    [K in keyof T] : K extends KeyToChangeType ? NewType : T[K]
}