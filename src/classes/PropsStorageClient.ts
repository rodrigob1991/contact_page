import {PrismaClient} from "@prisma/client"
import {HomeProps, HomePropsArgs, NewStory, Presentation, PresentationArgs, SetHomeProps, Story} from "../types/Home"
import {ObjectID} from "bson"
import {getContainedString} from "../utils/StringFunctions";

type NormalizedHomeProps<T extends HomePropsArgs | null> = T extends HomePropsArgs ? HomeProps : HomeProps | undefined

export class PropsStorageClient {
    private readonly prisma: PrismaClient
    private readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private readonly presentationId = new ObjectID("111111111111111111111111").toJSON()

    static readonly selectPresentation = {select: {name: true, introduction: true, image: true}}
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
                normalizedHomeProps[key] = (value === null ? undefined : key === "presentation" ? PropsStorageClient.#normalizePresentation(value as PresentationArgs) : value)
            }
        } else {
            normalizedHomeProps = undefined
        }
        return normalizedHomeProps as NormalizedHomeProps<T>
    }
    static #normalizePresentation(dbArgs: PresentationArgs): Presentation {
        return (({image, ...r}) => {
            return {image: PropsStorageClient.#getImageBase64Url(dbArgs.image), ...r}
        })(dbArgs)
    }

    static #getPresentationDbArgs(p: Presentation): PresentationArgs {
        return (({image, ...r}) => {
            return {image: PropsStorageClient.#getImageBuffer(p.image), ...r}
        })(p)
    }

    static #getImageBuffer(imageBase64: string | undefined) {
        return imageBase64 ? Buffer.from(getContainedString(imageBase64, ","), "base64url") : null
    }

    static #getImageBase64Url(imageBuffer: Buffer | null) {
        return imageBuffer ? Buffer.from(imageBuffer).toString("base64url") : undefined
    }

    async getHomeProps(): Promise<HomeProps | undefined> {
        return this.prisma.props.findUnique({
            where: {id: this.homePropsId},
            ...PropsStorageClient.selectHomeProps
        }).then(PropsStorageClient.#normalizeHomeProps)
    }

    async setPresentation(p: Presentation): Promise<Presentation> {
        const presentationArgs = PropsStorageClient.#getPresentationDbArgs(p)
        return this.prisma.presentation.upsert(
            {
                where: {id: this.presentationId},
                create: {
                    id: this.presentationId,
                    ...presentationArgs,
                    props: {
                        connectOrCreate: {
                            where: {id: this.homePropsId},
                            create: {id: this.homePropsId}
                        }
                    }
                },
                update: presentationArgs,
                ...PropsStorageClient.selectPresentation
            }
        ).then(PropsStorageClient.#normalizePresentation)
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
                           stories: {delete: deleteStories, new: newStories, update: updateStories} = {}
                       }: SetHomeProps) : Promise<HomeProps> {
        let createPresentation = undefined
        let upsertPresentation = undefined
        if (presentation) {
           const presentationDbArgs = PropsStorageClient.#getPresentationDbArgs(presentation)
            createPresentation = {
                create: {
                    id: this.presentationId,
                    ...presentationDbArgs
                }
            }
            upsertPresentation = {
                upsert: {
                    ...createPresentation,
                    update:
                    presentationDbArgs
                }
            }
        }
        let createManyStories = undefined
        if (newStories && newStories.length > 0) {
            createManyStories = {
                createMany: {
                    data: newStories
                }
            }
        }
        let updateManyStories = undefined
        if (updateStories && updateStories.length > 0) {
            updateManyStories = {
                update: updateStories.map((s) => {
                    return {where: {id: s.id}, data: (({id, ...s}) => s)(s)}
                })
            }
        }
        let deleteManyStories = undefined
        if (deleteStories && deleteStories.length > 0) {
            deleteManyStories = {
                deleteMany: {
                    id: {in: deleteStories},
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
                        ...deleteManyStories
                    }
                },
                ...PropsStorageClient.selectHomeProps
            }
        ).then(PropsStorageClient.#normalizeHomeProps)
    }
}
