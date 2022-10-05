import {PrismaClient, StoryState} from "@prisma/client"
import {
    CreateHomePropsArgs,
    CreateOrUpdatePresentationArgs,
    CreatePresentationArgs,
    DbOperation,
    HomeProps,
    HomePropsArgs,
    NewStory,
    Presentation,
    PresentationArgs,
    Story,
    UpdateHomePropsArgs,
    UpdatePresentationArgs
} from "../types/Home"
import {ObjectID} from "bson"
import {getContainedString} from "../utils/StringFunctions"

type NewEntity = Record<string, any>
type Entity = { id: string }

type NormalizedHomeProps<T extends HomePropsArgs | null> = T extends HomePropsArgs ? HomeProps : HomeProps | undefined

export class PropsStorageClient {
    private readonly prisma: PrismaClient

    private static readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private static readonly presentationId = new ObjectID("111111111111111111111111").toJSON()
    private static readonly imageUrlPrefix = "data:image/webp;base64"

    static readonly selectSkill = {select: {id: true, name: true, rate: true}}
    static readonly selectPresentation = {
        select: {
            name: true,
            introduction: true,
            image: true,
            skills: this.selectSkill
        }
    }
    static readonly selectStory = {select: {id: true, title: true, body: true, state: true}}
    static readonly selectPublishedStory = {...this.selectStory, where: {state: StoryState.PUBLISHED}}
    static readonly selectHomeProps = {
        select: {
            stories: this.selectPublishedStory,
            presentation: this.selectPresentation
        }
    }
    static readonly selectEditHomeProps = {
        select: {
            stories: this.selectStory,
            presentation: this.selectPresentation
        }
    }

    constructor() {
        this.prisma = new PrismaClient()
    }

    async getHomeProps(): Promise<HomeProps | undefined> {
        return this.prisma.props.findUnique({
                where: {id: PropsStorageClient.homePropsId},
                ...PropsStorageClient.selectHomeProps
            }
        ).then((homeProps) => this.#getNormalizeHomeProps(homeProps))
    }

    async getEditHomeProps(): Promise<HomeProps | undefined> {
        return this.prisma.props.findUnique({
                where: {id: PropsStorageClient.homePropsId},
                ...PropsStorageClient.selectEditHomeProps
            }
        ).then((homeProps) => this.#getNormalizeHomeProps(homeProps))
    }

    async setPresentation<O extends DbOperation>({
                                                     type,
                                                     args
                                                 }: { type: O, args: CreateOrUpdatePresentationArgs<O> }): Promise<Presentation> {
        const id = PropsStorageClient.presentationId
        const homePropsId = PropsStorageClient.homePropsId
        const select = PropsStorageClient.selectPresentation

        const connectOrCreateProps = {
            props: {
                connectOrCreate: {
                    where: {id: homePropsId},
                    create: {id: homePropsId}
                }
            }
        }

        let promise
        if (type === "create") {
            const {skills: {new: newSkills}, ...presentationRest} = args as CreatePresentationArgs
            promise = this.prisma.presentation.create(
                {
                    data: {
                        id: id,
                        ...this.#getPresentationWithImageBuffer(presentationRest),
                        skills: this.#getCreateMany(newSkills),
                        ...connectOrCreateProps,
                    },
                    ...select
                }
            )
        } else {
            const {
                skills: {delete: deleteSkills, new: newSkills, update: updateSkills},
                ...presentationRest
            } = args as UpdatePresentationArgs
            const saveManySkills = {skills: {...this.#getCreateMany(newSkills), ...this.#getUpdateMany(updateSkills), ...this.#getDeleteMany(deleteSkills)}}
            const data = this.#getUpdate({...this.#getPresentationWithImageBuffer(presentationRest), ...saveManySkills})

            promise = this.prisma.presentation.update(
                {
                    where: {id: id},
                    data: data,
                    ...select
                }
            )
        }

        return promise.then((p) => this.#getNormalizePresentation(p))
    }

    async setStory(story: NewStory | Story): Promise<Story> {
        const homePropsId = PropsStorageClient.homePropsId

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
                                where: {id: homePropsId},
                                create: {id: homePropsId}
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

    async createHomeProps({
                              presentation: {
                                  skills: {new: newSkills},
                                  ...presentationRest
                              }, stories: {new: newStories}
                          }: CreateHomePropsArgs) {
        const createManySkills = {skills: this.#getCreateMany(newSkills)}
        const createPresentation = {presentation: this.#getCreate({id: PropsStorageClient.presentationId, ...this.#getPresentationWithImageBuffer(presentationRest), ...createManySkills})}

        const createManyStories = {stories: this.#getCreateMany(newStories)}

        return this.prisma.props.create(
            {
                data: {
                    id: PropsStorageClient.homePropsId,
                    ...createPresentation,
                    ...createManyStories
                },
                ...PropsStorageClient.selectEditHomeProps
            }
        ).then((homeProps) => this.#getNormalizeHomeProps(homeProps))
    }
    async updateHomeProps({
                           presentation: {
                               skills: {delete: deleteSkills, new: newSkills, update: updateSkills},
                               ...presentationRest
                           },
                           stories: {delete: deleteStories, new: newStories, update: updateStories}
                       }: UpdateHomePropsArgs): Promise<HomeProps> {
        const saveManySkills = {skills: {...this.#getCreateMany(newSkills), ...this.#getUpdateMany(updateSkills), ...this.#getDeleteMany(deleteSkills)}}
        const updatePresentation = {presentation: this.#getUpdate({...this.#getPresentationWithImageBuffer(presentationRest), ...saveManySkills})}

        const saveManyStories = {stories: {...this.#getCreateMany(newStories), ...this.#getUpdateMany(updateStories), ...this.#getDeleteMany(deleteStories)}}

        return this.prisma.props.update(
            {
                where: {id: PropsStorageClient.homePropsId},
                data: {
                    ...updatePresentation,
                    ...saveManyStories,
                },
                ...PropsStorageClient.selectEditHomeProps
            }
        ).then((homeProps)=> this.#getNormalizeHomeProps(homeProps))
    }

    #getNormalizeHomeProps<T extends HomePropsArgs | null>(homeProps: T): NormalizedHomeProps<T> {
        let normalizedHomeProps: Record<string, any> | undefined
        if (homeProps) {
            normalizedHomeProps = {}
            for (const [key, value] of Object.entries(homeProps)) {
                normalizedHomeProps[key] = (value === null ? undefined : key === "presentation" ? this.#getNormalizePresentation(value as PresentationArgs) : value)
            }
        } else {
            normalizedHomeProps = undefined
        }
        return normalizedHomeProps as NormalizedHomeProps<T>
    }

    /* ----- PRIVATE METHODS TO MAP DATA FROM DB TO UI AND VICE VERSA ----- */
    #getNormalizePresentation(dbArgs: PresentationArgs): Presentation {
        return (({image, ...r}) => {
            return {image: this.#getImageBase64(dbArgs.image), ...r}
        })(dbArgs)
    }
    #getPresentationWithImageBuffer<P extends { image?: string | undefined }>(p: P) {
        return (({image, ...r}) => {
            return {image: this.#getImageBuffer(image), ...r}
        })(p)
    }
    #getImageBuffer(imageBase64: string | undefined) {
        return imageBase64 ? Buffer.from(getContainedString(imageBase64, ","), "base64") : null
    }
    #getImageBase64(imageBuffer: Buffer | null) {
        return imageBuffer ? PropsStorageClient.imageUrlPrefix + "," + Buffer.from(imageBuffer).toString("base64") : undefined
    }

    /* ----- PRIVATE METHODS TO HELP BUILD QUERIES ----- */
    #getCreate<NE extends NewEntity>(entity: NE) {
        return {create: {...entity}}
    }
    #getUpdate<NE extends NewEntity>(entity: NE | undefined, id?: string) {
        return {update: (id ? {where: {id: id}} : {}), ...entity}
    }
    #getCreateMany<NE extends NewEntity>(entities: NE[] | undefined) {
        return {createMany: entities && entities.length > 0 ? {data: entities} : undefined}
    }
    #getUpdateMany<E extends Entity>(entities: E[] | undefined) {
        return {
            update: entities && entities.length > 0 ? entities.map((e) => {
                return {where: {id: e.id}, data: (({id, ...e}) => e)(e)}
            }) : undefined
        }
    }
    #getDeleteMany(entitiesIds: string[] | undefined) {
        return {deleteMany: entitiesIds && entitiesIds.length > 0 ? {id: {in: entitiesIds}} : undefined}
    }
}
