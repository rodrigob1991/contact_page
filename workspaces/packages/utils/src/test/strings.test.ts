import {expect, test} from "@jest/globals"
import {getRandomInt} from "../random"
import {doXTimes} from "../loops"
import {recursiveSplit} from "../strings"
import {NonEmptyArray} from "../types"

const separator1 = ","
const separator2 = ":"
const separator3 = "$"
const separator4 = ")"
const separator5 = "("
const separator6 = "&"
const separator7 = "!"
const separators = [separator1, separator2, separator3, separator4, separator5, separator6, separator7]

const part1 = "part1"
const part2 = "part2"
const part3 = ""
const part4 = " "
const part5 = "part5"
const parts = [part1, part2, part3, part4, part5]
const getRandomPart = () => parts[getRandomInt(0, parts.length - 1)]

const getRecursiveSplitTestCase = (): [string[],string, (string | [])[]] => {
    const separatorsIndexes = [0, 1, 2, 3, 4, 5, 6]
    const resultSeparators: string[] = []
    const resultParts: (string | [])[] = []

    const separatorsNumber = getRandomInt(1, separatorsIndexes.length)
    doXTimes(separatorsNumber, (i) => {
        const separator = separators[separatorsIndexes.splice(getRandomInt(0, separatorsIndexes.length - 1), 1)[0]]
        resultSeparators.push(separator)
        const getNewPart = (): string | [] => {
            let part: string | []
            if (i === separatorsNumber) {
                part = getRandomPart()
            } else {
                const getEmptyPart = (x: number): string | [] => {
                    let r: string | []
                    if (i === x) {
                        r = ""
                    } else {
                        // @ts-ignore
                        r = [getEmptyPart(x - 1)]
                    }
                    return r
                }
                part = getEmptyPart(separatorsNumber)
            }
            return part
        }
        const addNewParts = () => {
            let currentPart = resultParts
            doXTimes(i -1, () => {
                currentPart = currentPart[getRandomInt(0, currentPart.length -1)] as []
            })
            const newParts = [getNewPart()]
            if (currentPart.length < 2) {
                newParts.push(getNewPart())
                if (currentPart.length === 1) {
                    currentPart.pop()
                }
            }
            currentPart.push(...newParts)
        }
        const separatorNumber = getRandomInt(1, 8)
        doXTimes(separatorNumber, () => {
            addNewParts()
        })
    })

    const getText = (sep: string[], re: (string | [])[]) => {
        let text = ""
        const currentSep = sep[0]
        for (const r of re) {
            const currentText = Array.isArray(r) ? getText(sep.slice(1, sep.length), r) : r
            text += currentText + currentSep
        }
        return text.substring(0, text.length - 1)
    }

    return [resultSeparators, getText(resultSeparators, resultParts), resultParts]
}

doXTimes(1000, ((i) => {
    test("recursive split " + i, () => {
        const [separators, text, expectedResult] = getRecursiveSplitTestCase()
        const result = recursiveSplit(text, separators as NonEmptyArray<string>)
        expect(expectedResult).toEqual(result)
    })
}))
