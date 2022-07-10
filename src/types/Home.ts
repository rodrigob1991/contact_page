import {Prisma} from '@prisma/client'

const homeProps = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type HomeProps = Prisma.PropsGetPayload<typeof homeProps>
type OmitHomeProps = Pick<HomeProps, "presentationId" | "id" | "stories">
export type HomeComponentProps = Omit<HomeProps, keyof OmitHomeProps> & {stories: Story[]}

type StoryArgs = Prisma.StoryGetPayload<Prisma.StoryArgs>
export type Story = Omit<StoryArgs, keyof Pick<StoryArgs, "propsId">>
type OmitStory = Pick<Story, "id">
export type StoryWithoutId = Omit<Story, keyof OmitStory>
type OptionalStoryId = Partial<OmitStory>
export type StoryComponent = StoryWithoutId & OptionalStoryId
export type StoryPutParam = Partial<Story>
export type StoryHTMLElementIds = {[K in keyof StoryWithoutId as `${K}`] : StoryWithoutId[K]}

export type Presentation = Prisma.PresentationGetPayload<Prisma.PresentationArgs>
type OmitPresentation = Pick<Presentation, "id">
type OptionalPresentationId = Partial<Pick<Presentation, "id">>
export type PresentationWithoutId = Omit<Presentation, keyof OmitPresentation>
export type PresentationComponent = PresentationWithoutId & OptionalPresentationId
export type PresentationPutParam = Partial<Presentation>
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutId as `${K}`] : PresentationWithoutId[K]}
