export const minWidthFullLayout = 1500
export const maxWidthSmallestLayout = 768

export const presentationLayout = {gap: 20, innerContainerPadding: 15, introductionMaxWidth: 300, maxChildHeight: 200, imageSize: 120, imageSizeSmall: 80}


export const skillsChartLayout = {
    barWidth: 20,
    barImageGap: 2,
    skillsGap: 5,
    get barGapWidth() {return this.barWidth + this.skillsGap },
    get barMaxHeight() { return presentationLayout.maxChildHeight - this.barWidth - this.barImageGap},
    getWidth: function (skillsNumber: number) { return (skillsNumber*this.barWidth) + ((skillsNumber-1)*this.skillsGap)},
    getMaxWidth: function (width: number) { return  width < this.barWidth ? 0 : width < this.barGapWidth + this.barWidth ? this.barWidth : width - (width%this.barGapWidth)}
} as const
export const skillsChartSmallestLayout = {barWidth: 15} as const
export type SkillsChartLayout = typeof skillsChartLayout
export type SkillsChartSmallestLayout = typeof skillsChartSmallestLayout
export type SkillBarWidth = (SkillsChartLayout | SkillsChartSmallestLayout)["barWidth"]