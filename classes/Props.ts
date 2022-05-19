import {PrismaClient} from "@prisma/client"
import {HomeProps, PresentationComponent, StoryComponent} from "../types/Home";
import {HOME_PROPS_ID} from "../pages";

class Props {
    private readonly prisma: PrismaClient["props"]
    private readonly HOME_PROPS_ID = "homePropsUnique"
    private readonly HOME_PROPS_PRESENTATION_ID = "homePropsPresentationUnique"

    constructor() {
        this.prisma = new PrismaClient().props
    }

    async getHomeProps() {
        return await this.prisma.findUnique({
            where: {id: this.HOME_PROPS_ID},
            include: {presentation: true, stories: true}

        })
    }

    async setHomePropsPresentation(presentationComponent: PresentationComponent) {
        const presentation = {id: this.HOME_PROPS_PRESENTATION_ID, ...presentationComponent}

        return this.prisma.upsert(
            {
                where: {id: HOME_PROPS_ID},
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
    }

    async setHomePropsStory(storyComponent: StoryComponent) {
        return this.prisma.upsert(
            {
                where: {id: HOME_PROPS_ID},
                create: {
                    stories: {
                        create: storyComponent
                    }
                },
                update: {
                    stories: {
                        upsert: {
                            where: {},
                            create: storyComponent,
                            update: storyComponent
                        }
                    }
                }
            }
        )
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