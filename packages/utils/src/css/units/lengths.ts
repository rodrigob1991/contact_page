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

export type CSSAbsoluteUnitsLengths = typeof cssAbsoluteUnitsLengths 
export type CSSAbsoluteUnitsLengthsKey = keyof CSSAbsoluteUnitsLengths
export type CSSAbsoluteUnitLength = CSSAbsoluteUnitsLengths[CSSAbsoluteUnitsLengthsKey]

export type CSSRelativeUnitsLengths = typeof cssRelativeUnitsLengths
export type CSSRelativeUnitsLengthsKey = keyof CSSRelativeUnitsLengths
export type CSSRelativeUnitLength = CSSRelativeUnitsLengths[CSSRelativeUnitsLengthsKey]

export type CSSUnitsLengths = CSSAbsoluteUnitsLengths | CSSRelativeUnitsLengths
export type CSSUnitsLengthsKey = CSSAbsoluteUnitsLengthsKey | CSSRelativeUnitsLengthsKey
export type CSSUnitLength = CSSAbsoluteUnitLength | CSSRelativeUnitLength