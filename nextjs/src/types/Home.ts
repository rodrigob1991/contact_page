import {Prisma} from '@prisma/client'
import {ChangePropertiesType} from "../utils/Types"
import {PropsStorageClient} from "../classes/PropsStorageClient"

export type DbOperation = "create" | "update"

export type ImageDbArgs = Prisma.ImageGetPayload<true>
export type Image = ChangePropertiesType<ImageDbArgs,[["src", string], ["name", string | undefined]]>

const homePropsDbArgs = Prisma.validator<Prisma.PropsArgs>()(PropsStorageClient.selectHomeProps)
export type HomePropsDbArgs = Prisma.PropsGetPayload<typeof homePropsDbArgs>
export type HomeProps = ChangePropertiesType<HomePropsDbArgs, [["stories", Story[]],["presentation", Presentation | undefined]]>
export type EditHomeProps = Partial<HomeProps>
type HomePropsPresentation = Pick<HomeProps, "presentation">
type SkillsPresentation = Pick<Presentation, "skills">
type CreateSkillsArgs = {new?: NewSkill[]}
type ManipulateSkillsArgs =  CreateSkillsArgs & {update?: Skill[], delete?: string[]}
type CreatePresentationSkillsArgs = {[K in keyof SkillsPresentation] : CreateSkillsArgs}
type UpdatePresentationSkillsArgs = {[K in keyof SkillsPresentation] : ManipulateSkillsArgs}
export type CreatePresentationArgs = CreatePresentationSkillsArgs & PresentationWithoutSkills
type UpdatePresentationWithoutSkillsArgs = Partial<PresentationWithoutSkills>
export type UpdatePresentationWithoutSkillsAndImageArgs = Omit<UpdatePresentationWithoutSkillsArgs, "image">
export type UpdatePresentationArgs = UpdatePresentationSkillsArgs & UpdatePresentationWithoutSkillsArgs
export type CreateOrUpdatePresentationArgs<DBO extends DbOperation> = DBO extends "create" ? CreatePresentationArgs : UpdatePresentationArgs
type CreateStoriesArgs = { new?: NewStory[] }
type ManipulateStoriesArgs = CreateStoriesArgs & { update?: Story[], delete?: string[] }
type HomePropsStories = Pick<HomeProps, "stories">
type CreateHomePropsStoriesArgs = { [K in keyof HomePropsStories]: CreateStoriesArgs }
type UpdateHomePropsStoriesArgs = { [K in keyof HomePropsStories]: ManipulateStoriesArgs }
export type CreateHomePropsArgs =
    { [K in keyof HomePropsPresentation]: CreatePresentationArgs }
    & CreateHomePropsStoriesArgs
export type UpdateHomePropsArgs =
    { [K in keyof HomePropsPresentation]: UpdatePresentationArgs }
    & UpdateHomePropsStoriesArgs

const storyDbArgs = Prisma.validator<Prisma.StoryArgs>()(PropsStorageClient.selectStory)
type StoryDbArgs = Prisma.StoryGetPayload<typeof storyDbArgs>
export type Story = StoryDbArgs
export type NewStory = Omit<Story, keyof Pick<Story, "id">>
export type NewStoryPropertiesType = NewStory[keyof NewStory]
export type StoryHTMLElementIds = {[K in keyof NewStory as `${K}`] : string}

const skillDbArgs = Prisma.validator<Prisma.SkillArgs>()(PropsStorageClient.selectSkill)
type SkillDbArgs = Prisma.SkillGetPayload<typeof skillDbArgs>
export type Skill = ChangePropertiesType<SkillDbArgs, [["image", Image]]>
export type NewSkill = Omit<Skill, keyof Pick<Skill, "id">>
export type NewSkillPropertiesType = NewSkill[keyof NewSkill]

const presentationDbArgs = Prisma.validator<Prisma.PresentationArgs>()(PropsStorageClient.selectPresentation)
export type PresentationDbArgs = Prisma.PresentationGetPayload<typeof presentationDbArgs>
export type Presentation = ChangePropertiesType<PresentationDbArgs, [["image", Image | undefined], ["skills", Skill[]]]>
export type PresentationWithoutImage = Omit<PresentationDbArgs, keyof Pick<PresentationDbArgs, "image">>
export type PresentationWithoutSkills = Omit<Presentation, keyof Pick<Presentation, "skills">>
export type PresentationPropertiesType = Presentation[keyof Presentation]
export type PresentationHTMLElementIdsKey = keyof PresentationWithoutImage
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutImage as `${K}`] : string}

export type ViewMode =  "editing" | "reading"

export type CreateOrUpdate<C, O> = O extends C ? "create" : "update"
