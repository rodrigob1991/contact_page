import {test, expect} from "@jest/globals"
import {orderByComparePreviousByString, orderByCounting} from "../utils/Arrays"

const recordsWithNumber = [{key: 2}, {key: 8}, {key: 2}, {key: 4}, {key: 3}]
const recordsWithNumberOrdered = [{key: 2}, {key: 2}, {key: 3}, {key: 4}, {key: 8}]
const recordsWithNumberOrderedResult = orderByCounting(recordsWithNumber, "key", (key) => key)
test("correctly ordered records with numbers by counting", () => {
    for (let i = 0; i < recordsWithNumberOrdered.length; i++) {
        expect(recordsWithNumberOrdered[i]).toEqual(recordsWithNumberOrderedResult[i])
    }
})

const recordsWithString = [{key: "ar"}, {key: "zo"}, {key: "ty"}, {key: "er"}, {key: "ae"}]
const recordsWithStringsOrdered = [{key: "ae"}, {key: "ar"}, {key: "er"}, {key: "ty"}, {key: "zo"}]
const recordsWithStringOrderedResult = orderByComparePreviousByString([...recordsWithString], "key")
test("correctly ordered records with string  by compare previous", ()=> {
    for (let i = 0; i < recordsWithStringsOrdered.length; i++) {
        expect(recordsWithStringsOrdered[i]).toEqual(recordsWithStringOrderedResult[i])
    }
})