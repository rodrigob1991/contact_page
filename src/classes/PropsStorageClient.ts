import {PrismaClient} from "@prisma/client"
import {HomeProps, Presentation, SetHomeProps, Story, NewStory, HomePropsArgs} from "../types/Home"
import {ObjectID} from "bson"

type NormalizedHomeProps<T extends HomePropsArgs | null> = T extends HomePropsArgs ? HomeProps : HomeProps | undefined

export class PropsStorageClient {
    private readonly prisma: PrismaClient
    private readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private readonly presentationId = new ObjectID("111111111111111111111111").toJSON()

    static readonly selectPresentation = {select: {name: true, introduction: true}}
    static readonly selectStory = {select: {id: true, title: true, body: true}}
    static readonly selectHomeProps = {
        select: {
            stories: this.selectStory,
            presentation: this.selectPresentation
        }
    }

    constructor() {
        this.prisma = new PrismaClient()
    }

    static #normalizeHomeProps<T extends HomePropsArgs | null>(homeProps: T): NormalizedHomeProps<T> {
        let normalizedHomeProps: Record<string, any> | undefined
        if (homeProps) {
            normalizedHomeProps = {}
            for (const [key, value] of Object.entries(homeProps)) {
                normalizedHomeProps[key] = (value === null ? undefined : value)
            }
        } else {
            normalizedHomeProps = undefined
        }
        return normalizedHomeProps as NormalizedHomeProps<T>
    }

    async getHomeProps(): Promise<HomeProps | undefined> {
        return this.prisma.props.findUnique({
            where: {id: this.homePropsId},
            ...PropsStorageClient.selectHomeProps
        }).then(PropsStorageClient.#normalizeHomeProps)
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
                ...PropsStorageClient.selectPresentation
            }
        )
    }
    async setStory(story: NewStory | Story) : Promise<Story> {
        if ("id" in story) {
            return this.prisma.story.update({
                where: {id: story.id},
                data: (({id, ...s}) => s)(story),
                ...PropsStorageClient.selectStory
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
                    ...PropsStorageClient.selectStory
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
                       }: SetHomeProps) : Promise<HomeProps> {
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
        if (newStories && newStories.length > 0) {
            createManyStories = {
                createMany: {
                    data: {
                        ...newStories
                    },
                }
            }
        }
        let updateManyStories = undefined
        if (updateStories && updateStories.length > 0) {
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
        if (deleteStories && deleteStories.length > 0) {
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
                ...PropsStorageClient.selectHomeProps
            }
        ).then(PropsStorageClient.#normalizeHomeProps)
    }
}
