export const isString = (v: unknown) : v is string => typeof v === "string"

export const isEmpty = <T extends string | undefined | null>(str: T): str is (undefined | null | "") & T => {
    return str === undefined || str === null || str.trim().length === 0
}
