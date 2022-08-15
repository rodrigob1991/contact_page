import {Prisma, StoryState} from '@prisma/client'
import {ChangePropertiesType} from "../utils/Types"
import {PropsStorageClient} from "../classes/PropsStorageClient"

const homePropsArgs = Prisma.validator<Prisma.PropsArgs>()(PropsStorageClient.selectHomeProps)
export type HomePropsArgs = Prisma.PropsGetPayload<typeof homePropsArgs>
export type HomeProps = ChangePropertiesType<HomePropsArgs, [["stories", Story[]],["presentation", Presentation | undefined]]>
type StoryOperations = { new?: NewStory[], update?: Story[], delete?: string[] }
type HomePropsPresentation = Pick<HomeProps, "presentation">
type SetHomePropsPresentation = {[K in keyof HomePropsPresentation]?: Presentation}
type HomePropsStories = Pick<HomeProps, "stories">
type SetHomePropsStories = {[K in keyof HomePropsStories]? : StoryOperations}
export type SetHomeProps = SetHomePropsPresentation & SetHomePropsStories

const storyArgs = Prisma.validator<Prisma.StoryArgs>()(PropsStorageClient.selectStory)
type StoryArgs = Prisma.StoryGetPayload<typeof storyArgs>
export type Story = StoryArgs
type t = Story["state"]
type OmitStory = Pick<Story, "id">
export type NewStory = Omit<Story, keyof OmitStory>
export type NewStoryPropertiesType = NewStory[keyof NewStory]
export type StoryHTMLElementIds = {[K in keyof NewStory as `${K}`] : NewStory[K]}

const presentationArgs = Prisma.validator<Prisma.PresentationArgs>()(PropsStorageClient.selectPresentation)
export type PresentationArgs = Prisma.PresentationGetPayload<typeof presentationArgs>
type OmitPresentation = Pick<PresentationArgs, "image">
export type PresentationWithoutImage = Omit<PresentationArgs, keyof OmitPresentation>
export type Presentation = ChangePropertiesType<PresentationArgs, [["image", string | undefined]]>
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutImage as `${K}`] : PresentationWithoutImage[K]}

export type ViewMode =  "editing" | "reading"
