import {test, expect} from "@jest/globals"
import {orderByComparePreviousByString, orderByCounting} from "../../../common/src/utils/Arrays"

const recordsWithNumber = [{key: 2}, {key: 8}, {key: 2}, {key: 4}, {key: 3}]

const recordsWithNumberAscendant = [{key: 2}, {key: 2}, {key: 3}, {key: 4}, {key: 8}]
const recordsWithNumberAscendantResult = orderByCounting(recordsWithNumber, "key", (key) => key)
test("correctly ordered ascendant records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberAscendant.length; i++) {
        expect(recordsWithNumberAscendant[i]).toEqual(recordsWithNumberAscendantResult[i])
    }
})
const recordsWithNumberDescendant = [{key: 8}, {key: 4}, {key: 3},{key: 2}, {key: 2}]
const recordsWithNumberDescendantResult = orderByCounting(recordsWithNumber, "key", (key) => key, "descendant")
test("correctly ordered descendant records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberDescendant.length; i++) {
        expect(recordsWithNumberDescendant[i]).toEqual(recordsWithNumberDescendantResult[i])
    }
})

const recordsWithString = [{key: "ar"}, {key: "zo"}, {key: "ty"}, {key: "er"}, {key: "ae"}]

const recordsWithStringsAscendant = [{key: "ae"}, {key: "ar"}, {key: "er"}, {key: "ty"}, {key: "zo"}]
const recordsWithStringAscendantResult = orderByComparePreviousByString([...recordsWithString], "key")
test("correctly ascendant records with string  by compare previous", ()=> {
    for (let i = 0; i < recordsWithStringsAscendant.length; i++) {
        expect(recordsWithStringsAscendant[i]).toEqual(recordsWithStringAscendantResult[i])
    }
})
const recordsWithStringsDescendant = [{key: "zo"}, {key: "ty"}, {key: "er"}, {key: "ar"}, {key: "ae"}]
const recordsWithStringDescendantResult = orderByComparePreviousByString([...recordsWithString], "key", "descendant")
test("correctly descendant records with string  by compare previous", ()=> {
    for (let i = 0; i < recordsWithStringsDescendant.length; i++) {
        expect(recordsWithStringsDescendant[i]).toEqual(recordsWithStringDescendantResult[i])
    }
})