/*return shallow copy of the record replacing properties with the array of tuples provided*/
import {ChangePropertiesType} from "./types"

export const getRecordWithNewProps = <R extends Record<string, any>, P extends [keyof R & string, any][]>(record: R, newProps: P): ChangePropertiesType<R, P> => {
    const modifyRecord = {...record}
    for (const [key, newProp] of newProps) {
        modifyRecord[key] = newProp
    }

    return modifyRecord
}