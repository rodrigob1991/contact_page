import {Prisma} from '@prisma/client'
import {ChangePropertiesType} from "../utils/Types"
import {PropsStorageClient} from "../classes/PropsStorageClient"

export type DbOperation = "create" | "update"

const homePropsArgs = Prisma.validator<Prisma.PropsArgs>()(PropsStorageClient.selectHomeProps)
export type HomePropsArgs = Prisma.PropsGetPayload<typeof homePropsArgs>
export type HomeProps = ChangePropertiesType<HomePropsArgs, [["stories", Story[]],["presentation", Presentation | undefined]]>
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

const storyArgs = Prisma.validator<Prisma.StoryArgs>()(PropsStorageClient.selectStory)
type StoryArgs = Prisma.StoryGetPayload<typeof storyArgs>
export type Story = StoryArgs
export type NewStory = Omit<Story, keyof Pick<Story, "id">>
export type NewStoryPropertiesType = NewStory[keyof NewStory]
export type StoryHTMLElementIds = {[K in keyof NewStory as `${K}`] : string}

const skillArgs = Prisma.validator<Prisma.SkillArgs>()(PropsStorageClient.selectSkill)
type SkillArgs = Prisma.SkillGetPayload<typeof skillArgs>
export type Skill = ChangePropertiesType<SkillArgs, [["image", string]]>
export type NewSkill = Omit<Skill, keyof Pick<Skill, "id">>
export type NewSkillPropertiesType = NewSkill[keyof NewSkill]

const presentationArgs = Prisma.validator<Prisma.PresentationArgs>()(PropsStorageClient.selectPresentation)
export type PresentationArgs = Prisma.PresentationGetPayload<typeof presentationArgs>
export type Presentation = ChangePropertiesType<PresentationArgs, [["image", string | undefined], ["skills", Skill[]]]>
export type PresentationWithoutImage = Omit<PresentationArgs, keyof Pick<PresentationArgs, "image">>
export type PresentationWithoutSkills = Omit<Presentation, keyof Pick<Presentation, "skills">>
export type PresentationPropertiesType = Presentation[keyof Presentation]
export type PresentationHTMLElementIdsKey = keyof PresentationWithoutImage
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutImage as `${K}`] : string}

export type ViewMode =  "editing" | "reading"

export type CreateOrUpdate<C, O> = O extends C ? "create" : "update"
