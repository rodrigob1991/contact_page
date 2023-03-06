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