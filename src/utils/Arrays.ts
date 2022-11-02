type RecordWithNumber<KN extends string> = { [K in KN]:  number}
type RecordWithString<KN extends string> = { [K in KN]:  string}

export const orderByCounting = <K extends string, R extends RecordWithNumber<K>[] | RecordWithString<K>[]>(array: R, key: K, getIndex: (v: R[number][K]) => number) => {
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
    for (const ca of countingArray) {
        if (ca) {
            resultArray.push(...ca)
        }
    }
    return resultArray as R
}

// preferable use for smalls numbers of elements
export const orderByComparePreviousByNumber = <K extends string>(records: RecordWithNumber<K>[], key: K) => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i
        while (currentIndex - 1 >= 0 && records[currentIndex - 1][key] > records[currentIndex][key]) {
            const current = records[currentIndex]
            records[currentIndex] = records[currentIndex - 1]
            records[currentIndex - 1] = current
            currentIndex--
        }
    }
    return records
}

export const orderByComparePreviousByString = <K extends string>(records: RecordWithString<K>[], key: K) => {
    for (let i = 1; i < records.length; i++) {
        let currentIndex = i
        while (currentIndex - 1 >= 0 && (records[currentIndex - 1][key].toLowerCase().localeCompare(records[currentIndex][key].toLowerCase()) === 1)) {
            const current = records[currentIndex]
            records[currentIndex] = records[currentIndex - 1]
            records[currentIndex - 1] = current
            currentIndex--
        }
    }
    return records
}

