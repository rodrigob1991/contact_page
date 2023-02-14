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

export const getIndexOnOccurrence = (str: string, search: string, occurrence: number) => {
    let index = 0
    let occurrences = 0
    let found = false
    while (!found && index < str.length) {
        if (str.startsWith(search, index)) {
            occurrences++
            if (occurrence === occurrences) {
                found = true
            }
        }
        index ++
    }
    return  found ? index - 1 : -1
}


