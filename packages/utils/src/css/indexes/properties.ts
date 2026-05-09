import { CamelOrPascalToKebab, Slice, Sum } from "src/types"
import { toCase } from "../../strings"
import { CSSKeywords, CSSValue, LengthPercentage, LineWidth, PositiveLength, ValueProducer, ValueProducerResult, valueProducer } from "./values"
import { KeyValue, PositiveNumber } from "src/types_checks"

type OrderedOptionals<S extends string[], P extends string[]=[]> = S extends [infer F extends string, ...infer R extends string[]] ? [...P, F] | OrderedOptionals<R, [...P, F]> : never
type FromStringsArrayArray<SAA extends string[][]> = 
type FromStringsArray<S extends string[]> = 

/** in this key value object resides all the CSS properties data
 *  all the keys that do not start with an underscore represents CSS properties
 *  a CSS property key that has CSS properties keys in its value is a shorthand
 * 
 *  properties with underscore {
 *      optionals {
 *          _keys {
 *               if array of arrays of strings, each array of strings represents a key value object with the strings as the keys.
 *               if array of strings 
 *          }
 *          _value {
 *          } 
 *          _values {
 *          } 
 *      }
 *  }
 *  
 *  
 */ 

export const cssPropertiesData = {
    border: {
        width: {
            _value: "medium" as LineWidth,
            _keys: [["all"], ["topBottom", "leftRight"], ["top", "leftRight", "bottom"], ["top", "bottom", "left", "right"]],
            top: {name: "borderTopWidth"},
            bottom: {name: "borderBottomWidth"},
            left: {name: "borderLeftWidth"},
            right: {name: "borderRightWidth"},
        },
    },
    translate: {
        _value: "0px" as LengthPercentage,
        _keys: ["x", "y", "z"]
    },
} as const

export type CSSPropertiesData = typeof cssPropertiesData
export type CSSPropertiesDataKey = keyof CSSPropertiesData
export type CSSProperties<TK extends string="", D extends KeyValue=CSSPropertiesData, DK extends keyof D=keyof D> = 
    DK extends infer K extends keyof D & string 
        ? K extends `_${string}` 
            ? never 
            : D[K] extends infer ND extends KeyValue 
                ? `${TK}${TK extends "" ? K : Capitalize<K>}` extends infer NTK extends string 
                    ? NTK | CSSPropertyKey<NTK, ND> 
                    : never 
                : never 
        : never



/* type PropertyArgMemberData = [PropertyKey, CSSValue, number]
type PropertyArgData = PropertyArgMemberData[number][]
type PropertyArgsData = PropertyArgData[]

type PropertyArgsMember<PADT extends PropertyArgMemberData, PAD extends PropertyArgsData, CL extends number[]=[]> = 
    {[K in PADT[0]]: PADT[1]} & 
    Slice<CL, 1> extends infer CLS extends number[] 
        ? CLS["length"] extends PADT[2] 
            ? {} 
            : PAD extends [infer F extends PropertyArgData, ...infer R extends PropertyArgsData] 
                ? Slice<F, Sum<[CL[0], CLS["lenght"]]>> extends [infer K extends PropertyKey , infer T extends CSSValue, infer C extends number] 
                    ? PropertyArgsMember<[K, T, C], R, [Sum<CLS>]> & PropertyArgsMember<PADT, PAD, [...CL, C]> 
                    : never
                : never
        : never
type PropertyArgs<PAD extends PropertyArgsData, TC extends number = 0> = 
    PAD extends [infer F extends PropertyArgData, ...infer R extends PropertyArgsData] 
        ? F extends [infer K extends PropertyKey , infer T extends CSSValue, infer C extends number, ...infer RKTC extends PropertyArgData]
            ? PropertyArgsMember<[K, T, C], R, [TC]> | PropertyArgs<[RKTC, ...R], Sum<[TC, C]>> 
            : never
        : never
 */
/* export type CSSProperties = {
    [K in CSSPropertyKey]: CSSPropertiesData[K] extends readonly[infer F, ...infer R] ? F | PropertyArgs<R> : never
}
const getPropertyValueStr = <K extends CSSPropertyKey, A extends CSSProperties[K]>(key: K, args: A) => {
    

} */

/* export type CSSPropertiesProducer = {
    borderWidth: ValueProducer<[a: LineWidth, b?:LineWidth, c?: LineWidth, d?:LineWidth], CSSKeywords["none"]>,
    translate: ValueProducer<[a: LengthPercentage, b?: LengthPercentage, c?: LengthPercentage]>,
    height: ValueProducer<[a: LengthPercentage]>,
    width: ValueProducer<[a: LengthPercentage]>
}
 */
/* export const cssPropertiesProducer: CSSPropertiesProducer = {
    borderWidth: valueProducer,
    translate: valueProducer,
    height: valueProducer,
    width: valueProducer
} as const */

//type KeyArgsTuple<K extends CSSPropertyKey=CSSPropertyKey> = K extends CSSPropertyKey ? [K, CSSPropertyArgs<K>] : never
//type KeyArgsTuples<KL extends CSSPropertyKey[]=CSSPropertyKey[]> = KL extends [infer K extends CSSPropertyKey, ...infer R extends CSSPropertyKey[]] ? [[K, CSSPropertyArgs<K>], ...KeyArgsTuples<R>] : KeyArgsTuple<KL[number]>[]

type KeyPartsValueStr<P extends CSSProperties> = [[keyparts], `valuestr`]
const getKeyPartsValueStr = <P extends CSSProperties>(properties: P) => {
    
    
}
//export type CSSPropertyStr<KAT extends KeyArgsTuple> = KAT extends KeyArgsTuple ? `${CamelOrPascalToKebab<KAT[0]>}: ${ValueProducerResult<KAT[1]>};` : never
export type CSSPropertiesStr<P extends CSSProperties> =  KeyPartsValueStr<P> `str`
export const getCssPropertiesStr = <P extends CSSProperties>(properties: P) => {
    const keyPartsValueStr = getKeyPartsValueStr(properties)
    let str = ""
    for (const [keyParts, valueStr] of keyPartsValueStr) {
        str += `${keyParts.join("-")}: ${valueStr};`
    }
    return str as CSSPropertiesStr<P>
}

//type KeyArgs<K extends CSSPropertyKey=CSSPropertyKey> = {[MK in K]: CSSPropertyArgs<MK>}

export type CSSPropertiesKeyValue<P extends CSSProperties> = KeyPartsValueStr<P> {}
export const getCssPropertiesKeyValue = <P extends CSSProperties>(properties: P) => {
    const keyPartsValueStr = getKeyPartsValueStr(properties)
    const keyValue = {}
    for (const [keyParts, valueStr] of keyPartsValueStr) {
        keyValue[keyParts.map((kp, i) => i != 0 ? kp[0].toUpperCase() + kp.substring(1) : kp).join()] = valueStr
    }
    return keyValue as CSSPropertiesKeyValue<P>
}

//export type CSSPropertiesProducer = typeof cssPropertiesProducer

//export type CSSPropertyArgs<K extends CSSPropertyKey=CSSPropertyKey> = Parameters<CSSPropertiesProducer[K]>


