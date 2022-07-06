import {Prisma} from '@prisma/client'

const homeProps = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type HomeProps = Prisma.PropsGetPayload<typeof homeProps>
type OmitHomeProps = Pick<HomeProps, "presentationId" | "id">
export type HomeComponentProps = Omit<HomeProps, keyof OmitHomeProps>

export type Story = Prisma.StoryGetPayload<Prisma.StoryArgs>
type OmitStory = Pick<Story, "propsId" | "id">
type OptionalStoryId = Partial<Pick<Story, "id">>
export type StoryComponent = Omit<Story, keyof OmitStory> & OptionalStoryId
export type StoryPutParam = Partial<Story>

export type Presentation = Prisma.PresentationGetPayload<Prisma.PresentationArgs>
type OmitPresentation = Pick<Presentation, "id">
type OptionalPresentationId = Partial<Pick<Presentation, "id">>
export type PresentationWithoutId = Omit<Presentation, keyof OmitPresentation>
export type PresentationComponent = PresentationWithoutId & OptionalPresentationId
export type PresentationPutParam = Partial<Presentation>
export type PresentationHTMLElementIds = {[K in keyof PresentationWithoutId as `${K}HtmlElementId`] : PresentationWithoutId[K]}
