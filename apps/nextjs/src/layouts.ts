export const minWidthFullLayout = 1500
export const maxWidthSmallestLayout = 768

const liveIconSize = 85
const sendEmailIconSize = 70
const chatViewThumbnailTop = 50
const chatViewThumbnailLeft = 70
export const messengerLayout = {
     liveIconSize,
     sendEmailIconSize,
     chatViewThumbnailWidth: 50,
     chatViewThumbnailHeight: 35,
     chatViewThumbnailTop,
     chatViewThumbnailLeft
}
export const messengerSmallestLayout = {
     liveIconSize:55,
     sendEmailIconSize: 40,
     chatViewThumbnailWidth: 35,
     chatViewThumbnailHeight: 20,
     get chatViewThumbnailTop() {return chatViewThumbnailTop - (liveIconSize - this.liveIconSize) + 10},
     get chatViewThumbnailLeft() {return chatViewThumbnailLeft - (liveIconSize - this.liveIconSize)}
}

export const presentationLayout = {
    gap: 20,
    innerContainerPadding: 15,
    separatorWidthOrHeight: 2,
    introductionMaxWidth: 300,
    maxChildHeight: 200,
    imageSize: 120,
    imageSizeSmall: 80,
    getIntroductionMaxWidth: function (width: number) {return width > this.introductionMaxWidth ? this.introductionMaxWidth : width}
}

export const skillsChartLayout = {
    barWidth: 20,
    barImageGap: 2,
    skillsGap: 5,
    get barGapWidth() {return this.barWidth + this.skillsGap},
    get barMaxHeight() { return presentationLayout.maxChildHeight - this.barWidth - this.barImageGap},
    getWidth: function (skillsNumber: number) { return (skillsNumber*this.barWidth) + ((skillsNumber-1)*this.skillsGap)},
    getMaxWidth: function (width: number, skillsNumber: number) {
        let maxWidth = 0
        if(width < this.barWidth) {
        }else if (width < this.barGapWidth + this.barWidth){
            maxWidth = this.barWidth
        }else {
            const limitWidth = this.getWidth(skillsNumber)
            maxWidth = width > limitWidth ? limitWidth : width - (width%this.barGapWidth)
        }
         return maxWidth
        }
} as const
export const skillsChartSmallestLayout = {barWidth: 15} as const
export type SkillsChartLayout = typeof skillsChartLayout
export type SkillsChartSmallestLayout = typeof skillsChartSmallestLayout
export type SkillBarWidth = (SkillsChartLayout | SkillsChartSmallestLayout)["barWidth"]