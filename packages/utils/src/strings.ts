import { numberRgx } from "./regular_expressions"
import { CaseType } from "./types"
import { NonEmptyArray, isNonEmpty } from "./types_checks"

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
export const getNumber = (str: string): number | undefined => {
    const matched = str.match(numberRgx)
    return matched ? +matched : undefined
}

export const upperCaseFirstChar = <S extends string>(str: S) => (str.substring(0, 1).toUpperCase() + str.substring(1)) as Capitalize<S>

export const toCase = (str: string, to: CaseType, wordSeparators?: string) => {
    let defaultWordSeparators
    let replacer: ((match: string) => string) | string  
    let get: (str: string) => string
    switch (to) {
        case "camel":
            defaultWordSeparators = "-_ "
            replacer = (match) => match[1].toUpperCase()
            get = (str) => str[0].toLowerCase() + str.substring(1)
            break
        case "pascal":
            defaultWordSeparators = "-_ "
            replacer = (match) => match[1].toUpperCase()
            get = (str) => str[0].toUpperCase() + str.substring(1)
            break
        case "kebab":
            defaultWordSeparators = "[a-z][A-Z] "
            replacer = "$1-$2"
            get = (str) => str.toLowerCase()
            break
        case "snake":
            defaultWordSeparators = "[a-z][A-Z] "
            replacer = "$1_$2"
            get = (str) => str.toLowerCase()
    }
    return get(str.replace(new RegExp(`[${wordSeparators ?? defaultWordSeparators}]`), replacer))
}
