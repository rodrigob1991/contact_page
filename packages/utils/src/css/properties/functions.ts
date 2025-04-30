import type { Properties } from 'csstype'
import { toCase } from 'src/strings'
import { CamelOrPascalToKebab, IfTrueFalseExtends, IfUndefinedOtherExtends, InterpolateKeysValues, PropertiesUnion } from 'src/types'
import { KeyValue } from 'src/types_checks'

export type CSSProperties = Properties
export type CSSPropertyKey = keyof CSSProperties
export type CSSPropertyValue = CSSProperties[CSSPropertyKey]

export type CSSPropertyStr<K extends CSSPropertyKey> = K extends K ? `${CamelOrPascalToKebab<K>}:${CSSProperties[K]};` : never
export type CSSFunctionStr<K extends CSSPropertyKey> = K extends K ? `${CamelOrPascalToKebab<K>}(${string})` : never

export type CSSObjectOneKey<K extends CSSPropertyKey | undefined, MP extends KeyValue, TF extends IfUndefinedOtherExtends<K, boolean, false>> = {
    key: K
    mapProperties: (properties: MP) => IfUndefinedOtherExtends<K, CSSProperties[Exclude<K, undefined>]>
    keysValues: IfUndefinedOtherExtends<K, PropertiesUnion<{[OK in Exclude<K, undefined>]: CSSProperties[OK]}>>
    string: IfUndefinedOtherExtends<K, CSSPropertyStr<Exclude<K, undefined>>>
    toFunction: TF
    functionString: IfTrueFalseExtends<TF, CSSFunctionStr<Exclude<K, undefined>>, undefined>
} & MP

export const cssObjectOneKey: CSSObjectOneKey<CSSPropertyKey | undefined, KeyValue, boolean> = {
    key: undefined,
    mapProperties(properties) {return undefined},
    get keysValues() {
        let keysValues = undefined
        if (this.key) {
            keysValues = {[this.key]: this.mapProperties(this)} as Required<PropertiesUnion<CSSProperties>>
        } 
        return  keysValues
    },
    get string() {
        let string = undefined
        if (this.key) {
            string = `${toCase(this.key, "kebab")}:${this.mapProperties(this)};` as CSSPropertyStr<CSSPropertyKey>
        }
        return  string
    },
    toFunction: false,
    get functionString() {
        let functionString = undefined
        if (this.key && this.toFunction) {
            functionString = `${toCase(this.key, "kebab")}(${this.mapProperties(this)})` as CSSFunctionStr<CSSPropertyKey>
        }
        return functionString
    }
}

export type CSSObjectMultipleKeys<MP extends KeyValue<CSSPropertyKey>, TF extends boolean> = {
    mapProperty: <K extends keyof Pick<MP, CSSPropertyKey>>(key: K, value: MP[K]) => CSSProperties[K]
    keysValues: {[K in Extract<keyof MP, CSSPropertyKey>]: CSSProperties[K]}
    string: () => InterpolateKeysValues<{[K in Extract<keyof MP, CSSPropertyKey> as CamelOrPascalToKebab<K>]: CSSProperties[K]}, "", ":", ";">
    toFunction: TF
    functionString: () => IfTrueFalseExtends<TF, InterpolateKeysValues<{[K in Extract<keyof MP, CSSPropertyKey> as CamelOrPascalToKebab<K>]: CSSProperties[K]}, "", "(", ")">, undefined>
} & Pick<MP, CSSPropertyKey>

export const cssObjectMultipleKeys: CSSObjectWithoutUniqueKey<CSSPropertyKey, KeyValue, boolean> = {
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



