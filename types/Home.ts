import {Prisma} from '@prisma/client'

const homeProps = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type HomeProps = Prisma.PropsGetPayload<typeof homeProps>
type OmitHomeProps = Pick<HomeProps, "presentationId" | "id">
export type HomeComponentProps = Omit<HomeProps, keyof OmitHomeProps>

export type Story = Prisma.StoryGetPayload<Prisma.StoryArgs>
type OmitStory = Pick<Story, "propsId">
export type StoryComponent = Omit<Story, keyof OmitStory>

export type Presentation = Prisma.PresentationGetPayload<Prisma.PresentationArgs>
type OmitPresentation = Pick<Presentation, "id">
export type PresentationComponent = Omit<Presentation, keyof OmitPresentation>
