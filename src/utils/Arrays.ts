type RecordWithNumber<KN extends string> = { [K in KN]:  number}
type RecordWithString<KN extends string> = { [K in KN]:  string}
type Direction = "ascendant" | "descendant"

export const orderByCounting = <K extends string, R extends RecordWithNumber<K>[] | RecordWithString<K>[]>(array: R, key: K, getIndex: (v: R[number][K]) => number, direction: Direction = "ascendant") => {
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
export const orderByComparePreviousByNumber = <K extends string, R extends RecordWithNumber<K>[]>(records: R, key: K, direction: Direction = "ascendant") => {
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

export const orderByComparePreviousByString = <K extends string, R extends RecordWithString<K>[]>(records: R, key: K, direction: Direction = "ascendant") => {
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

