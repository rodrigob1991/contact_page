import {PrismaClient} from "@prisma/client"
import {PresentationComponent, StoryComponent} from "../types/Home"

class PropsClient {
    private readonly prisma: PrismaClient
    private readonly HOME_PROPS_ID = "homePropsUnique"
    private readonly PRESENTATION_ID = "homePropsPresentationUnique"

    constructor() {
        this.prisma = new PrismaClient()
    }

    async getHomeProps() {
        return await this.prisma.props.findUnique({
            where: {id: this.HOME_PROPS_ID},
            include: {presentation: true, stories: true}

        })
    }

   /* async setHomePropsPresentation(presentationComponent: PresentationComponent) {
        const presentation = {id: this.HOME_PROPS_PRESENTATION_ID, ...presentationComponent}

        return this.prisma.upsert(
            {
                where: {id: this.HOME_PROPS_ID},
                create: {
                    presentation: {
                        create: presentation
                    }
                },
                update: {
                    presentation: {
                        upsert: {
                            create: presentation,
                            update: presentation
                        }
                    }
                }
            }
        )
    }*/

    async setPresentation(presentation: PresentationComponent) {
        return this.prisma.presentation.upsert(
            {
                where: {id: this.PRESENTATION_ID},
                create: {
                    ...presentation,
                    props: {
                        connectOrCreate: {
                            where: {id: this.HOME_PROPS_ID},
                            create: {id: this.HOME_PROPS_ID}
                        }
                    }
                }
                ,
                update: presentation,
            }
        )
    }

    async setStory(storyComponent: StoryComponent) {
        return this.prisma.story.upsert(
            {
                where: {id: storyComponent.id},
                create: {
                    ...storyComponent,
                    props: {
                        connectOrCreate: {
                            where: {id: this.HOME_PROPS_ID},
                            create: {id: this.HOME_PROPS_ID}
                        }
                    }
                }
                ,
                update: storyComponent,
            }
        )
    }

    async deleteStory(id: string) {
        return this.prisma.story.delete({where: {id: id}})
    }

    /*async setHomeProps(presentation?: { name: string, introduction: string }, stories?: { title: string, body: string }[]) {
        const homeProps =
        await this.prisma.upsert({
            where: {id: this.HOME_PROPS_ID},
            create: homeProps,
            update: homeProps
        })
    }
*/
}

export const propsClient = new PropsClient()