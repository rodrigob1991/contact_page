// TODO: implement methods to convert from each absolute unit to pixels 
export const cssAbsoluteUnitsLengths = {
    centimeters: "cm",
	millimeters: "mm",
    quarterMillimeters:  "Q",		
	inches: "in",
	picas: "pc",
	points: "pt", 
	pixels: "px"
} as const
export type CSSAbsoluteUnitsLengths = typeof cssAbsoluteUnitsLengths 
export type CSSAbsoluteUnitsLengthsKey = keyof CSSAbsoluteUnitsLengths
export type CSSAbsoluteUnitLength = CSSAbsoluteUnitsLengths[CSSAbsoluteUnitsLengthsKey]


export const cssRelativeUnitsLengths = {
    parentLength: "em", 	
    heightFont: "ex",	
	widthCeroCharacter: "ch",
	fontSizeRootElement: "rem",
	lineHeightElement: "lh",
	lineHeightRootElement: "rlh",
	onePercentViewportWidth: "vw", 
	onePercentViewportHeight: "vh",
    onePercentViewportSmallerDimension: "vmin",
    onePercentViewportLargerDimension:  "vmax",
	onePercentSizeContainingBlockDirectionRootElementBlockAxis: "vb",
	onePercentSizeContainingBlockDirectionRootElementInlineAxis: "vi",
    onePercentSmallViewportWidth: "svw",
    onePercentSmallViewportHeight: "svh",
    onePercentLargeViewportWidth: "lvw",
    onePercentLargeViewportHeight: "lvh",
    onePercentDynamicViewportWidth: "dvw",
    onePercentDynamicViewportHeight: "dvh",
} as const
export type CSSRelativeUnitsLengths = typeof cssRelativeUnitsLengths
export type CSSRelativeUnitsLengthsKey = keyof CSSRelativeUnitsLengths
export type CSSRelativeUnitLength = CSSRelativeUnitsLengths[CSSRelativeUnitsLengthsKey]

export type CSSUnitsLengths = CSSAbsoluteUnitsLengths | CSSRelativeUnitsLengths
export type CSSUnitsLengthsKey = CSSAbsoluteUnitsLengthsKey | CSSRelativeUnitsLengthsKey
export type CSSUnitLength = CSSAbsoluteUnitLength | CSSRelativeUnitLength

const cssAngleUnits = {
	degrees: "deg",
	radians: "rad",
	gradians: "grad",
	turns: "turn"
} as const
export type CSSAngleUnits = typeof cssAngleUnits
export type CSSAngleUnitsKey = keyof CSSAngleUnits
export type CSSUnitAngle = CSSAngleUnits[CSSAngleUnitsKey]

const cssFrequencyUnits = {
	hertz: "Hz",
	kilohertz: "kHz",
} as const
export type CSSFrequencyUnits = typeof cssFrequencyUnits	
export type CSSFrequencyUnitsKey = keyof CSSFrequencyUnits
export type CSSUnitFrequency = CSSFrequencyUnits[CSSFrequencyUnitsKey]

const cssTimeUnits = {
	seconds: "s",
	milliseconds: "ms"
} as const
export type CSSTimeUnits = typeof cssTimeUnits
export type CSSTimeUnitsKey = keyof CSSTimeUnits
export type CSSUnitTime = CSSTimeUnits[CSSTimeUnitsKey]

export type CSSUnit = CSSUnitLength | CSSUnitAngle | CSSUnitFrequency | CSSUnitTime