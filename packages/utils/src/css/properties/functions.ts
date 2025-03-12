import type { Properties } from 'csstype'
import { CamelOrPascalToKebab, IfExtendsUndefinedAndOther } from 'src/types'
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

export type CSSObject<UK extends UniqueKey, EP extends ExtraProperties<UK>> = { 
    uniqueKey: UK
    mapExtraProperty: MapExtraProperty<UK, EP>
    mapExtraProperties: MapExtraProperties 
    keysValues: Properties
    string: () => string
    functionString: () => string
} & EP

export type CSSObjectWithUniqueKey<UK extends CSSPropertyKey, EP extends KeyValue, UKK extends CamelOrPascalToKebab<UK>=CamelOrPascalToKebab<UK>> = {
    uniqueKey: UK
    mapExtraProperty: <K extends keyof EP>(key: K, value: EP[K]) => CSSPropertyValue
    keysValues: {[K in UK]: CSSPropertyValue}
    string: () => `${UKK}:${string};`
    functionString: () => `${UKK}(${string})`
} & EP

export type CSSObjectWithoutUniqueKey<EP extends KeyValue<CSSPropertyKey>> = {
    mapExtraProperty: <K extends keyof Pick<EP, CSSPropertyKey>>(key: K, value: EP[K]) => CSSProperties[K]
    keysValues: Pick<EP, CSSPropertyKey>
    string: () => string
    functionString: () => string
} & Pick<EP, CSSPropertyKey>

export const cssObject: CSSObject<undefined, {}> = {
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

// const p = {one: "",get two(){return this.one}}

// Object.crea

// const h = {b: 2,__proto__: p}

// h.p

// class CSSObject {
//     #
// }



