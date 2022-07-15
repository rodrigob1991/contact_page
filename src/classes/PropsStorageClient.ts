import {PrismaClient} from "@prisma/client"
import {HomeProps, Presentation, SetHomeProps, Story, NewStory} from "../types/Home"
import {ObjectID} from "bson"

export class PropsStorageClient {
    private readonly prisma: PrismaClient
    private readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private readonly presentationId = new ObjectID("111111111111111111111111").toJSON()
    private readonly selectPresentation = {select: {name: true, introduction: true}}
    private readonly selectStory = {select: {id: true, title: true, body: true}}
    private readonly selectHomeProps = {
        stories: this.selectStory,
        presentation: this.selectPresentation
    }

    constructor() {
        this.prisma = new PrismaClient()
    }

    async getHomeProps(): Promise<HomeProps | undefined> {
        return this.prisma.props.findUnique({
            where: {id: this.homePropsId},
            include: this.selectHomeProps
        }).then((props) => {
            return props ? {presentation: props.presentation || undefined, stories: props.stories}
                : undefined
        })
    }

    async setPresentation(presentation: Presentation): Promise<Presentation> {
        return this.prisma.presentation.upsert(
            {
                where: {id: this.presentationId},
                create: {
                    id: this.presentationId,
                    ...presentation,
                    props: {
                        connectOrCreate: {
                            where: {id: this.homePropsId},
                            create: {id: this.homePropsId}
                        }
                    }
                },
                update: presentation,
                ...this.selectPresentation
            }
        )
    }
    async setStory(story: NewStory | Story) : Promise<Story> {
        if ("id" in story) {
            return this.prisma.story.update({
                where: {id: story.id},
                data: (({id, ...s}) => s)(story),
                ...this.selectStory
            })
        } else {
            return this.prisma.story.create(
                {
                    data: {
                        ...story,
                        props: {
                            connectOrCreate: {
                                where: {id: this.homePropsId},
                                create: {id: this.homePropsId}
                            }
                        }
                    },
                    ...this.selectStory
                }
            )
        }
    }
    async deleteStory(id: string) {
        return this.prisma.story.delete({where: {id: id}})
    }
    async setHomeProps({
                           presentation,
                           stories: {delete: deleteStories, new: newStories = [], update: updateStories} = {}
                       }: SetHomeProps) {
        let createPresentation = undefined
        let upsertPresentation = undefined
        if (presentation) {
            createPresentation = {
                create: {
                    id: this.presentationId,
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
                    },
                }
            }
        }
        let updateManyStories = undefined
        if (updateStories) {
            updateManyStories = {
                updateMany: {
                    where: {
                        propsId: this.homePropsId
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
                where: {id: this.homePropsId},
                create: {
                    id: this.homePropsId,
                    presentation: createPresentation,
                    stories: createManyStories
                },
                update: {
                    presentation: upsertPresentation,
                    stories: {
                        ...createManyStories,
                        ...updateManyStories,
                        ...deleteManyStories,
                    }
                },
                include: this.selectHomeProps
            }
        )
    }
}