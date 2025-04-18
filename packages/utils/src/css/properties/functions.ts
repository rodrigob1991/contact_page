import type { Properties } from 'csstype'
import { toCase } from 'src/strings'
import { CamelOrPascalToKebab, IfTrueFalseExtends, InterpolateKeysValues, PropertiesUnion } from 'src/types'
import { KeyValue } from 'src/types_checks'

export type CSSProperties = Properties
export type CSSPropertyKey = keyof CSSProperties
export type CSSPropertyValue = CSSProperties[CSSPropertyKey]

/* export function getCSSValueStr(values: string[]) {
    return values.join(" ")
}
export function getCSSPropertyStr(name: string, values: string[]) {
    return name + ": " + getCSSValueStr(values) + ";"
}
export function getCSSPropertyKeyValue(name: string, values: string[]) {
    return {[name]: getCSSValueStr(values)}
}
export function getCSSFunctionStr(name: string, values: string[]) {
    return name + "(" + values.join(",") + ")"
}
export function getCSSPropertyWithFunctionsStr(name: string, fnNamesValues: [string, string[]][]) {
    return getCSSPropertyStr(name, fnNamesValues.map(([fnName, fnValues]) => getCSSFunctionStr(fnName, fnValues)))
}
 */
//type UniqueKey = PropertyKey | undefined 
type ExtraProperties<UK extends UniqueKey> = IfExtendsUndefinedAndOther<UK, KeyValue<PropertyKey>, KeyValue>
type MapExtraProperty<UK extends UniqueKey, EP extends ExtraProperties<UK>> = <K extends keyof EP>(key: K, value: EP[K]) => PropertyValue

//type DoFirst<WUK extends boolean=false> = FunctionUnionAccumulateArgs<WUK, [[false, [[], void]], [true, [[string], void]]]> 
//type Map<WUK extends boolean=false> = FunctionUnionAccumulateArgs<WUK, [[false, [[string, string], void]], [true, [[string], void]]]>
//type DoLast<WUK extends boolean=false> = FunctionUnionAccumulateArgs<WUK, [[false, [[], void]], [true, [[string], void]]]> 
type DoFirst<UK extends UniqueKey> = IfExtendsUndefinedAndOther<UK, KeyValue<PropertyKey>, KeyValue>
type Map<UK extends UniqueKey> = IfExtendsUndefinedAndOther<UK, KeyValue<PropertyKey>, KeyValue>
type DoLast<UK extends UniqueKey> = IfExtendsUndefinedAndOther<UK, KeyValue<PropertyKey>, KeyValue>
type MapExtraPropertiesArg<UK extends UniqueKey> = {doFirst: DoFirst<UK>, map: Map<UK>, doLast: DoLast<UK>}
type MapExtraProperties = (withUniqueKey: MapExtraPropertiesArg<true>, withoutUniqueKey: MapExtraPropertiesArg) => void

/* export type CSSObject<UK extends UniqueKey, EP extends ExtraProperties<UK>> = { 
    uniqueKey: UK
    mapExtraProperty: MapExtraProperty<UK, EP>
    mapExtraProperties: MapExtraProperties 
    keysValues: Properties
    string: () => string
    functionString: () => string
} & EP
 */
export type CSSObjectWithUniqueKey<UK extends CSSPropertyKey, MP extends KeyValue, TF extends boolean> = {
    uniqueKey: UK
    mapProperties: (properties: MP) => CSSPropertyValue
    keysValues: PropertiesUnion<{[K in UK]: CSSProperties[K]}>
    string: `${CamelOrPascalToKebab<UK>}:${CSSProperties[UK]};`
    toFunction: TF
    functionString: IfTrueFalseExtends<TF, `${CamelOrPascalToKebab<UK>}(${string})`, undefined>
} & MP

export const cssObjectWithUniqueKey: CSSObjectWithUniqueKey<CSSPropertyKey, KeyValue, boolean> = {
    uniqueKey: "widows", // dummy
    mapProperties(properties) {return ""},
    get keysValues() {
        return  {[this.uniqueKey]: this.mapProperties(this.mappedProperties)}
    },
    get string() {
        return `${toCase(this.uniqueKey, "kebab")}:${this.mapProperties(this.mappedProperties)};`
    },
    toFunction: false,
    get functionString() {
        let functionString = undefined
        if (this.toFunction) {
            functionString = `${toCase(this.uniqueKey, "kebab")}(${this.mapProperties(this.mappedProperties)})`
        }
        return functionString
    }
}

export type CSSObjectWithoutUniqueKey<MP extends KeyValue<CSSPropertyKey>, TF extends boolean> = {
    mappedProperties: Pick<MP, CSSPropertyKey>
    mapProperty: <K extends keyof Pick<MP, CSSPropertyKey>>(key: K, value: MP[K]) => CSSProperties[K]
    keysValues: {[K in Extract<keyof MP, CSSPropertyKey>]: CSSProperties[K]}
    string: () => InterpolateKeysValues<{[K in Extract<keyof MP, CSSPropertyKey> as CamelOrPascalToKebab<K>]: CSSProperties[K]}, "", ":", ";">
    toFunction: TF
    functionString: () => IfTrueFalseExtends<TF, InterpolateKeysValues<{[K in Extract<keyof MP, CSSPropertyKey> as CamelOrPascalToKebab<K>]: CSSProperties[K]}, "", "(", ")">, undefined>
}

export const cssObjectWithoutUniqueKey: CSSObjectWithoutUniqueKey<CSSPropertyKey, KeyValue, boolean> = {
    mappedProperties: {},
    mapProperties(properties) {return ""},
    get keysValues() {
        return  {[this.uniqueKey]: this.mapProperties(this.mappedProperties)}
    },
    get string() {
        return `${this.uniqueKey}:${this.mapProperties(this.mappedProperties)};`
    },
    toFunction: false,
    functionString() {
        let functionString = undefined
        if (this.toFunction) {
            functionString = `${this.uniqueKey}(${this.mapProperties(this.mappedProperties)})`
        }
        return functionString
    }
}

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



