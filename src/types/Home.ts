import {Prisma} from '@prisma/client'
import {ChangePropertiesType} from "../utils/Types"

const propsArgs = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type PropsArgs = Prisma.PropsGetPayload<typeof propsArgs>
type OmitHomeProps = Pick<PropsArgs, "presentationId" | "id">
export type HomeProps = ChangePropertiesType<Omit<PropsArgs, keyof OmitHomeProps>, [["stories", Story[]],["presentation", Presentation | undefined]]>
type StoryOperations = { new?: NewStory[], update?: Story[], delete?: Story[] }
type HomePropsPresentation = Pick<HomeProps, "presentation">
type SetHomePropsPresentation = {[K in keyof HomePropsPresentation]?: Presentation}
type HomePropsStories = Pick<HomeProps, "stories">
type SetHomePropsStories = {[K in keyof HomePropsStories]? : StoryOperations}
export type SetHomeProps = SetHomePropsPresentation & SetHomePropsStories

type StoryArgs = Prisma.StoryGetPayload<Prisma.StoryArgs>
export type Story = Omit<StoryArgs, keyof Pick<StoryArgs, "propsId">>
type OmitStory = Pick<Story, "id">
export type NewStory = Omit<Story, keyof OmitStory>
export type StoryHTMLElementIds = {[K in keyof NewStory as `${K}`] : NewStory[K]}

type PresentationArgs = Prisma.PresentationGetPayload<Prisma.PresentationArgs>
type OmitPresentation = Pick<PresentationArgs, "id">
export type Presentation = Omit<PresentationArgs, keyof OmitPresentation>
export type PresentationHTMLElementIds = {[K in keyof Presentation as `${K}`] : Presentation[K]}
