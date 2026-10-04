// TODO: implement methods to convert from each absolute unit to pixels 
export const cssAbsoluteUnitsLengths = {
    cm: "centimeters",
	mm: "millimeters",
    Q:  "quarterMillimeters",		
	in: "inches",
	pc: "picas",
	pt: "points",
	px: "pixels"
} as const
export type CSSAbsoluteUnitsLengths = typeof cssAbsoluteUnitsLengths 
export type CSSAbsoluteUnitLength = keyof CSSAbsoluteUnitsLengths

export const cssRelativeUnitsLengths = {
    em: "parentLength", 	
    ex: "heightFont",	
	ch: "widthCeroCharacter",
	rem: "fontSizeRootElement",
	lh: "lineHeightElement",		
	rlh: "lineHeightRootElement",
	vw: "onePercentViewportWidth", 
	vh: "onePercentViewportHeight",
    vmin: "onePercentViewportSmallerDimension",
    vmax: "onePercentViewportLargerDimension",
	vb: "onePercentSizeContainingBlockDirectionRootElementBlockAxis",
	vi: "onePercentSizeContainingBlockDirectionRootElementInlineAxis",
    svw: "onePercentSmallViewportWidth",
    svh: "onePercentSmallViewportHeight",
    lvw: "onePercentLargeViewportWidth",
    lvh: "onePercentLargeViewportHeight",
    dvw: "onePercentDynamicViewportWidth",
    dvh: "onePercentDynamicViewportHeight",
} as const
export type CSSRelativeUnitsLengths = typeof cssRelativeUnitsLengths
export type CSSRelativeUnitLength = keyof CSSRelativeUnitsLengths

export const cssUnitLength = {
	absolute: cssAbsoluteUnitsLengths,
	relative: cssRelativeUnitsLengths
} as const
export type CSSUnitsLengths = CSSAbsoluteUnitsLengths | CSSRelativeUnitsLengths
export type CSSUnitLength = CSSAbsoluteUnitLength | CSSRelativeUnitLength

const cssAngleUnits = {
	deg: "degrees",
	rad: "radians",
	grad: "gradians",
	turn: "turns"
} as const
export type CSSAngleUnits = typeof cssAngleUnits
export type CSSUnitAngle = keyof CSSAngleUnits

const cssFrequencyUnits = {
	Hz: "hertz",
	kHz: "kilohertz",
} as const
export type CSSFrequencyUnits = typeof cssFrequencyUnits	
export type CSSUnitFrequency = keyof CSSFrequencyUnits

const cssTimeUnits = {
	s: "seconds",
	ms: "milliseconds"
} as const
export type CSSTimeUnits = typeof cssTimeUnits
export type CSSUnitTime = keyof CSSTimeUnits

export type CSSUnit = CSSUnitLength | CSSUnitAngle | CSSUnitFrequency | CSSUnitTime