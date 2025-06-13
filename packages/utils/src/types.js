"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//export type CallableUnion<T, A extends [unknown, Callable][]> = A extends [infer FA extends [unknown, Callable],  ...infer RA extends [unknown, Callable][]] ? (FA[0] extends T ? FA[1] : never) | FunctionUnion<T, RA> : never
//export type FunctionUnionAccumulateArgs<T, A extends [unknown, [unknown[], unknown]][], AINE extends boolean=true, LA extends unknown[]=[]> = A extends [infer FA extends [unknown, [unknown[], unknown]],  ...infer RA extends [unknown, [unknown[], unknown]][]] ? FA[0] extends  T ? ((...args: [...LA, ...FA[1][0]]) => FA[1][1]) | FunctionUnionAccumulateArgs<T, RA, AINE, [...LA, ...FA[1][0]]> : FunctionUnionAccumulateArgs<T, RA, AINE, true extends AINE ? [...LA, ...FA[1][0]] : LA> : never
//--------------------------
