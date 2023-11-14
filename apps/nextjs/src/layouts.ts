export const minWidthFullLayout = 1500
export const maxWidthSmallestLayout = 768

export const presentationLayout = {gap: 20, maxChildHeight: 200, imageSize: 120, imageSizeSmall: 80}


export const skillsChartLayout = {barWidth: 20, barImageGap: 2, skillsGap: 5, get barMaxHeight() { return presentationLayout.maxChildHeight - this.barWidth - this.barImageGap}} as const
export const skillsChartSmallestLayout = {barWidth: 15} as const
export type SkillsChartLayout = typeof skillsChartLayout
export type SkillsChartSmallestLayout = typeof skillsChartSmallestLayout
export type SkillBarWidth = (SkillsChartLayout | SkillsChartSmallestLayout)["barWidth"]