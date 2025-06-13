"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssObjectMultipleKeys = exports.newCssObjectOneKey = exports.cssObjectOneKey = exports.d = void 0;
const strings_1 = require("src/strings");
exports.d = "der";
exports.cssObjectOneKey = {
    get key() { return undefined; },
    get mapProperties() { return undefined; },
    get keyValue() {
        let keyValue = undefined;
        if (this.key && this.mapProperties) {
            keyValue = { [this.key]: this.mapProperties(this) };
        }
        return keyValue;
    },
    get string() {
        let string = undefined;
        if (this.key && this.mapProperties) {
            string = `${(0, strings_1.toCase)(this.key, "kebab")}:${this.mapProperties(this)};`;
        }
        return string;
    },
    get toFunction() { return false; },
    get functionString() {
        let functionString = undefined;
        if (this.key && this.mapProperties && this.toFunction) {
            functionString = `${(0, strings_1.toCase)(this.key, "kebab")}(${this.mapProperties(this)})`;
        }
        return functionString;
    }
};
const newCssObjectOneKey = (key, mapProperties, properties) => Object.create(exports.cssObjectOneKey, Object.assign({ key, mapProperties }, properties));
exports.newCssObjectOneKey = newCssObjectOneKey;
exports.cssObjectMultipleKeys = {
    get mapProperty() { return undefined; },
    get keyValue() {
        let keyValue = undefined;
        if (this.mapProperty) {
            const keyValueTuples = [];
            for (const key in this) {
                if (this.hasOwnProperty(key)) {
                    keyValueTuples.push([key, this.mapProperty(key, this[key])]);
                }
            }
            if (keyValueTuples.length > 0) {
                keyValue = Object.fromEntries(keyValueTuples);
            }
        }
        return keyValue;
    },
    get string() {
        return `${this.uniqueKey}:${this.mapProperties(this.mappedProperties)};`;
    },
    get toFunction() { return false; },
    get functionString() {
        let functionString = undefined;
        if (this.toFunction) {
            functionString = `${this.uniqueKey}(${this.mapProperties(this.mappedProperties)})`;
        }
        return functionString;
    }
};
/* export const cssObject: CSSObject<undefined, {}> = {
    uniqueKey: undefined,
    mapExtraProperty() {return ""},
    mapExtraProperties(withUniqueKey, withoutUniqueKey) {
        const uniqueKey = this.uniqueKey
        let doFirst: DoFirst, map: Map, doLast: DoLast
        if (uniqueKey) {
            doFirst = () => {withUniqueKey.doFirst(uniqueKey)}
            map = (key, value) => {withUniqueKey.map(key, value, uniqueKey)}
            doLast = () => {withUniqueKey.doLast(uniqueKey)}
        } else {
            ({doFirst, map, doLast} = withoutUniqueKey)
        }

        doFirst()
        for (const key in this) {
            if (this.hasOwnProperty(key))
                map(key, this.mapExtraProperty(key, this[key]))
        }
        doLast()
    },
    get keysValues() {
        const keysValues: Properties = {}
        const mapPropertiesArgs: MapPropertiesArgs = {
            withUniqueKey: {
                doFirst: (uniqueKey) => { keysValues[uniqueKey] = "" },
                map: (key, value, uniqueKey) => { keysValues[uniqueKey] += " " + value },
            },
            withoutUniqueKey: {
                map: (key, value) => { keysValues[key] = value }
            }
        }
        this.mapProperties({withUniqueKey, withoutUniqueKey})

        return keysValues
    },
    get string() {
        let string = ""
        const withUniqueKey = {
            doFirst: (uniqueKey) => { string += uniqueKey + ":" },
            map: (key, value, uniqueKey) => { string += " " + value },
            doLast: () => { string += ";" }
        }
        const withoutUniqueKey = {
            map: (key, value) => { string += key + ":" + value + ";" }
        }
        this.mapProperties({withUniqueKey, withoutUniqueKey})

        return string
    },
    get functionString() {
        let string = ""
        const withUniqueKey = {
            doFirst: (uniqueKey) => { string += uniqueKey + "(" },
            map: (key, value, uniqueKey) => { string += value + ","},
            doLast: () => { string.slice(0, -1) + ")" }
        }
        const withoutUniqueKey = {
            map: (key, value) => { string += key + "(" + value + ")" }
        }
        this.mapProperties({withUniqueKey, withoutUniqueKey})

        return string
    }
}
 */
// const p = {one: "",get two(){return this.one}}
// Object.crea
// const h = {b: 2,__proto__: p}
// h.p
// class CSSObject {
//     #
// }
