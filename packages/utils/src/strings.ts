import { numberRgx } from "./regularExpressions"
import {isNonEmpty, NonEmptyArray} from "./types"

export const getContainedString = (str: string, betweenLeft?: string, betweenRight?: string) => {
    let containedString
    if (betweenLeft && betweenRight) {
        containedString = str.substring(str.indexOf(betweenLeft) + 1, str.indexOf(betweenRight))
    } else if (betweenLeft) {
        containedString = str.substring(str.indexOf(betweenLeft) + 1)
    } else if (betweenRight) {
        containedString = str.substring(0, str.indexOf(betweenRight))
    } else {
        containedString = str
    }
    return containedString
}

export const isEmpty = (str: string | undefined | null) => {
    return str === undefined || str === null || str.trim().length === 0
}

export const getIndexOnOccurrence = (str: string, search: string, occurrence: number, reverse=false) => {
    let index = reverse ? str.length - 1 : 0
    let occurrences = 0
    let found = false
    const isStringLeft = reverse ? ()=> index >= 0 : ()=> index < str.length
    const updateIndex = reverse ? ()=> { index-- } : ()=> { index++ }
    while (!found && isStringLeft()) {
        if (str.startsWith(search, index)) {
            occurrences++
            if (occurrence === occurrences) {
                found = true
            }
        }
        updateIndex()
    }
    return  found ? index - 1 : -1
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

export const getNumbers = (str: string): number[] => {
    return [...str.matchAll(numberRgx)].map(([numberStr]) => +numberStr)
}