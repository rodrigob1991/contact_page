import {PrismaClient} from "@prisma/client"
import {PresentationWithoutId, SetHomeProps, StoryComponent} from "../types/Home"
import {ObjectID} from "bson"

export class PropsStorageClient {
    private readonly prisma: PrismaClient
    private readonly HOME_PROPS_ID = new ObjectID("111111111111111111111111").toJSON()
    private readonly PRESENTATION_ID = new ObjectID("111111111111111111111111").toJSON()

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

    async setPresentation(presentation: PresentationWithoutId) {
        return this.prisma.presentation.upsert(
            {
                where: {id: this.PRESENTATION_ID},
                create: {
                    id: this.PRESENTATION_ID,
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

    async setStory(story: StoryComponent) {
        if (story.id) {
            return this.prisma.story.update({
                where: {id: story.id},
                data: (({id, ...s}) => s)(story)
            })
        } else {
            return this.prisma.story.create(
                {
                    data: {
                        ...story,
                        props: {
                            connectOrCreate: {
                                where: {id: this.HOME_PROPS_ID},
                                create: {id: this.HOME_PROPS_ID}
                            }
                        }
                    }
                }
            )
        }
    }

    async deleteStory(id: string) {
        return this.prisma.story.delete({where: {id: id}})
    }

    async setHomeProps({
                           presentation,
                           stories: {delete: deleteStories, new: newStories, update: updateStories} = {}
                       }: SetHomeProps) {
        let createPresentation = undefined
        let upsertPresentation = undefined
        if (presentation) {
            createPresentation = {
                create: {
                    id: this.PRESENTATION_ID,
                    ...presentation
                }
            }
            upsertPresentation = {
                upsert: {
                    ...createPresentation,
                    update:
                    presentation
                }
            }
        }
        let createManyStories = undefined
        if (newStories) {
            createManyStories = {
                createMany: {
                    data: {
                        ...newStories
                    }
                }
            }
        }
        let updateManyStories = undefined
        if (updateStories) {
            updateManyStories = {
                updateMany: {
                    where: {
                        propsId: this.HOME_PROPS_ID
                    },
                    data: {
                        ...updateStories
                    }
                }
            }
        }
        let deleteManyStories = undefined
        if (deleteStories) {
            deleteManyStories = {
                deleteMany: {
                    ...deleteStories
                }
            }
        }

        return this.prisma.props.upsert(
            {
                where: {id: this.HOME_PROPS_ID},
                create: {
                    id: this.HOME_PROPS_ID,
                    presentation: createPresentation,
                    stories: createManyStories
                },
                update: {
                    presentation: upsertPresentation,
                    stories: {
                        ...createManyStories,
                        ...updateManyStories,
                        ...deleteManyStories
                    }
                }
            }
        )
    }
}