import {Prisma} from '@prisma/client'
import {ChangePropertyType} from "../utils/Types"

const homeProps = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type HomeProps = Prisma.PropsGetPayload<typeof homeProps>
type OmitHomeProps = Pick<HomeProps, "presentationId" | "id">
export type HomeComponentProps = ChangePropertyType<Omit<HomeProps, keyof OmitHomeProps>, "stories", Story[]>
type StoryOperations = { new?: StoryWithoutId[], update?: Story[], delete?: Story[] }
type HomePropsPresentation = Pick<HomeProps, "presentation">
type SetHomePropsPresentation = {[K in keyof HomePropsPresentation]?: PresentationWithoutId}
type HomePropsStories = Pick<HomeProps, "stories">
type SetHomePropsStories = {[K in keyof HomePropsStories]? : StoryOperations}
export type SetHomeProps = SetHomePropsPresentation & SetHomePropsStories

type StoryArgs = Prisma.StoryGetPayload<Prisma.StoryArgs>
export type Story = Omit<StoryArgs, keyof Pick<StoryArgs, "propsId">>
type OmitStory = Pick<Story, "id">
export type StoryWithoutId = Omit<Story, keyof OmitStory>
type OptionalStoryId = Partial<OmitStory>
export type StoryHTMLElementIds = {[K in keyof StoryWithoutId as `${K}`] : StoryWithoutId[K]}

export type Presentation = Prisma.PresentationGetPayload<Prisma.PresentationArgs>
type OmitPresentation = Pick<Presentation, "id">
type OptionalPresentationId = Partial<Pick<Presentation, "id">>
export type PresentationWithoutId = Omit<Presentation, keyof OmitPresentation>
export type PresentationComponent = PresentationWithoutId & OptionalPresentationId
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutId as `${K}`] : PresentationWithoutId[K]}
