import type { Properties } from 'csstype'
import { toCase } from 'src/strings'
import { AllCombinations, CamelOrPascalToKebab, IfTrueFalseExtends, IfUndefinedOtherExtends, PropertiesUnion } from 'src/types'
import { KeyValue } from 'src/types_checks'

export type CSSPropertyKey = keyof Properties
export type CSSProperties<K extends CSSPropertyKey=CSSPropertyKey> = Pick<Properties, K>
export type CSSPropertyValue = CSSProperties[CSSPropertyKey]

export type CSSPropertyStr<K extends CSSPropertyKey> = K extends K ? `${CamelOrPascalToKebab<K>}:${CSSProperties[K]};` : never
export type CSSFunctionStr<K extends CSSPropertyKey> = K extends K ? `${CamelOrPascalToKebab<K>}(${string})` : never

type MapProperties<K extends CSSPropertyKey, PM extends KeyValue> = (properties: PM) => CSSProperties[Exclude<K, undefined>]
type MapPropertiesOrUndefined<K extends CSSPropertyKey | undefined, MP extends KeyValue> = IfUndefinedOtherExtends<K, MapProperties<Exclude<K, undefined>, MP>>
type ToFunction<K extends CSSPropertyKey | undefined> = IfUndefinedOtherExtends<K, boolean, false>

export type CSSObjectOneKey<K extends CSSPropertyKey | undefined, PM extends KeyValue, TF extends ToFunction<K>> = Readonly<{
    key: K
    mapProperties: MapPropertiesOrUndefined<K, PM>
    keyValue: IfUndefinedOtherExtends<K, PropertiesUnion<CSSProperties<Exclude<K, undefined>>>>
    string: IfUndefinedOtherExtends<K, CSSPropertyStr<Exclude<K, undefined>>>
    toFunction: TF
    functionString: IfTrueFalseExtends<TF, CSSFunctionStr<Exclude<K, undefined>>, undefined>
}> & PM

export const cssObjectOneKey: CSSObjectOneKey<CSSPropertyKey | undefined, KeyValue, boolean> = {
    get key() {return undefined},
    get mapProperties() {return undefined},
    get keyValue() {
        let keyValue = undefined
        if (this.key && this.mapProperties) {
            keyValue = {[this.key]: this.mapProperties(this)} as Required<PropertiesUnion<CSSProperties>>
        } 
        return  keyValue
    },
    get string() {
        let string: CSSPropertyStr<CSSPropertyKey> | undefined = undefined
        if (this.key && this.mapProperties) {
            string = `${toCase(this.key, "kebab")}:${this.mapProperties(this)};` as CSSPropertyStr<CSSPropertyKey>
        }
        return  string
    },
    get toFunction() {return false},
    get functionString() {
        let functionString = undefined
        if (this.key && this.mapProperties && this.toFunction) {
            functionString = `${toCase(this.key, "kebab")}(${this.mapProperties(this)})` as CSSFunctionStr<CSSPropertyKey>
        }
        return functionString
    }
}

export const newCssObjectOneKey = <K extends CSSPropertyKey | undefined, PM extends KeyValue, TF extends ToFunction<K>>(key: K, mapProperties: MapPropertiesOrUndefined<K, PM>, properties: PM) => 
    Object.create(cssObjectOneKey, {key, mapProperties, ...properties}) as CSSObjectOneKey<K, PM, TF>

type PropertiesToMap = KeyValue<CSSPropertyKey>
type MapProperty<PM extends PropertiesToMap> = <K extends keyof Pick<PM, CSSPropertyKey>>(key: K, value: PM[K]) => CSSProperties[K]

export type CSSObjectMultipleKeys<PM extends PropertiesToMap | undefined, TF extends IfUndefinedOtherExtends<PM, boolean, false>> = Readonly<{
    mapProperty: IfUndefinedOtherExtends<PM, MapProperty<Exclude<PM, undefined>>>
    keyValue: IfUndefinedOtherExtends<PM, CSSProperties<Extract<keyof PM, CSSPropertyKey>>>
    string: IfUndefinedOtherExtends<PM, AllCombinations<CSSPropertyStr<Extract<keyof PM, CSSPropertyKey>>>>
    toFunction: TF
    functionString: IfTrueFalseExtends<TF, AllCombinations<CSSFunctionStr<Extract<keyof PM, CSSPropertyKey>>>, undefined>
}> & (PropertiesToMap extends PM ? Pick<Exclude<PM, undefined>, CSSPropertyKey> : never)

export const cssObjectMultipleKeys: CSSObjectMultipleKeys<PropertiesToMap | undefined, boolean> = {
    get mapProperty() {return undefined},
    get keyValue() {
        let keyValue = undefined
        if (this.mapProperty) {
            const keyValueTuples = []
            for (const key in this) {
                if (this.hasOwnProperty(key)) {
                    keyValueTuples.push([key, this.mapProperty(key, this[key])])
                }
            }
            if (keyValueTuples.length > 0) {
                keyValue = Object.fromEntries(keyValueTuples) as CSSProperties
            }
        }
        return  keyValue
    },
    get string() {
        return `${this.uniqueKey}:${this.mapProperties(this.mappedProperties)};`
    },
    get toFunction() {return false},
    get functionString() {
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



