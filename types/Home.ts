import {Prisma} from '@prisma/client'

const homeProps = Prisma.validator<Prisma.PropsArgs>()({
    include: {presentation: true, stories: true},
})
export type HomeProps = Prisma.PropsGetPayload<typeof homeProps>

export type Story = Prisma.StoryGetPayload<Prisma.StoryArgs>

export type Presentation = Prisma.PresentationGetPayload<Prisma.PresentationArgs>