import fs from "fs"
import {recursiveSplit} from "./strings"
import {NonEmptyArray} from "./types"

export const getFileContent = (path: string) =>
    new Promise<string>((resolve, reject) => {
        fs.readFile(path, 'utf8', (error, content) => {
            if (error) {
                reject("error opening file in" + path + ", " + error.message)
            } else {
                resolve(content)
            }
        })
    })
export const getSplitFileContent = <S extends (NonEmptyArray<string>)>(path: string, separators: S) =>
    getFileContent(path).then(content => recursiveSplit(content, separators))


