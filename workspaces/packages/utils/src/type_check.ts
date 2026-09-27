export type TypeGuard<T> = (v: unknown) => v is T

export const isNonNullable = <T>(v: T): v is NonNullable<T> => v !== undefined && v !== null



