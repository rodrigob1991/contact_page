import { numberRgx } from "./regular_expressions"
import { CaseType } from "./types"
import { NonEmptyArray, isNonEmpty } from "./types_checks"
import * as ts from 'typescript'

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

export const defaultStartWord = ["[A-Z]", "[a-z]"]
export const defaultBodyWord = ["[a-z]"]

/**
 * @param str the string from which to match the words
 * @param to case type to form the returned string
 * @param [startWord] strings that can be the start of a word, could have rgx format, defaults: "[A-Z]" y "[a-z]"
 * @param [bodyWord] strings that can be the body of a word, could have rgx format, defaults: "[a-z]"
 * @returns words matched from str turned into a string in the "to" param case type format
 */
export const toCase = (str: string, to: CaseType, startWord: string[]=defaultStartWord, bodyWord: string[]=defaultBodyWord): string => {
    let mapWord: (word: string, index: number) => string
    let separator: string
    switch (to) {
        case "camel":
            mapWord = (word, index) => index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.substring(1)
            separator = ""
            break
        case "pascal":
            mapWord = (word, index) => word[0].toUpperCase() + word.substring(1)
            separator = ""
            break
        case "kebab":
            mapWord = (word, index) => word.toLowerCase()
            separator = "-"
            break
        case "snake":
            mapWord = (word, index) => word.toLowerCase()
            separator = "_"
    }
    return (str.match(new RegExp(`(${startWord.join("|")})(${bodyWord.join("|")})*`))??[]).map(mapWord).join(separator)
}
