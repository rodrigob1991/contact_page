//TODO: make this ugly code better.

import { KeyValue } from "../keyvalue/type";
import { NonEmptyArray } from "./type"
import { isNonEmpty } from "./type_check"

type KeyNumberValue<KN extends string> = KeyValue<KN, number>
type KeyStringValue<KN extends string> = KeyValue<KN, string>
type Direction = "ascendant" | "descendant"

export const orderByCounting = <K extends string, R extends KeyNumberValue<K>[] | KeyStringValue<K>[]>(array: R, key: K, getIndex: (v: R[number][K]) => number, direction: Direction = "ascendant") => {
    const countingArray = []
    for (const e of array) {
        const countIndex = getIndex(e[key])
        const ca = countingArray[countIndex]
        if (ca) {
            ca.push(e)
        } else {
            countingArray[countIndex] = [e]
        }
    }
    const resultArray = []
    const forArgs = direction === "ascendant"
        ? {index: 0, until : function () {return this.index < countingArray.length}, afterEach: function () {this.index ++}}
        : {index: countingArray.length - 1, until : function () {return this.index > 0}, afterEach: function () {this.index --}}
    for (forArgs.index; forArgs.until(); forArgs.afterEach()) {
        const ca = countingArray[forArgs.index]
        if (ca) {
            resultArray.push(...ca)
        }
    }
    return resultArray as R
}

// preferable use for smalls numbers of elements
export const orderByComparePreviousByNumber = <K extends string, R extends KeyNumberValue<K>[]>(records: R, key: K, direction: Direction = "ascendant") => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i
        const areDifferent = direction === "ascendant"
            ? (prev: number, curr: number) => prev > curr
            : (prev: number, curr: number) => prev < curr
        while (currentIndex - 1 >= 0 && areDifferent(records[currentIndex - 1][key], records[currentIndex][key])) {
            const current = records[currentIndex]
            records[currentIndex] = records[currentIndex - 1]
            records[currentIndex - 1] = current
            currentIndex--
        }
    }
    return records
}

export const orderByComparePreviousByString = <K extends string, R extends KeyStringValue<K>[]>(records: R, key: K, direction: Direction = "ascendant") => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i
        const areDifferent = direction === "ascendant"
            ? (prev: string, curr: string) => prev.toLowerCase().localeCompare(curr.toLowerCase()) === 1
            : (prev: string, curr: string) => prev.toLowerCase().localeCompare(curr.toLowerCase()) === -1
        while (currentIndex - 1 >= 0 && areDifferent(records[currentIndex - 1][key], records[currentIndex][key])) {
            const current = records[currentIndex]
            records[currentIndex] = records[currentIndex - 1]
            records[currentIndex - 1] = current
            currentIndex--
        }
    }
    return records
}


type RecursiveSplitResult<S extends (NonEmptyArray<string>)>= S extends [infer F, ...infer R] ? R extends (NonEmptyArray<string>) ? RecursiveSplitResult<R>[] : string[] : never
export const recursiveSplit = <S extends (NonEmptyArray<string>)>(str: string, separators: S): RecursiveSplitResult<S> => {
    const finalParts = []
    const currentParts = str.split(separators[0])
    const separatorsRest = separators.slice(1)
    if (isNonEmpty(separatorsRest)) {
        for (const part of currentParts) {
            finalParts.push(recursiveSplit(part, separatorsRest))
        }
    } else {
        finalParts.push(...currentParts)
    }

    return finalParts as RecursiveSplitResult<S>
}