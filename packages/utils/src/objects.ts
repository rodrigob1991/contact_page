/*return shallow copy of the record replacing properties with the array of tuples provided*/
import {ChangePropertiesType} from "./types"

export const getObjectWithNewProps = <O extends object, P extends [keyof O, unknown][]>(object: O, newProps: P): ChangePropertiesType<O, P> => {
    const modifiedObject = {...object}
    for (const [key, newProp] of newProps) {
        modifiedObject[key] = newProp
    }

    return modifiedObject
}

export const isEmpty = (object: object) => Object.keys(object).length === 0