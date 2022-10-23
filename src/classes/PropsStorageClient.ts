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
    Skill,
    Story,
    UpdateHomePropsArgs,
    UpdatePresentationArgs,
    UpdatePresentationWithoutSkillsAndImageArgs
} from "../types/Home"
import {ObjectID} from "bson"
import {getContainedString} from "../utils/StringManipulations"
import {getRecordWithNewProps} from "../utils/RecordManipulations"

type NewEntity = Record<string, any>
type Entity = { id: string }

type BufferImage = Buffer | null
type Base64Image = string | undefined
type EntityWithBufferImage<T extends BufferImage> = { image: T }
type Base64ImageConvert<T extends BufferImage> = T extends Buffer ? string : Base64Image
type EntityWithBase64Image<T extends Base64Image> = { image: T }
type BufferImageConvert<T extends Base64Image> = T extends string ? Buffer : BufferImage

type NormalizedHomeProps<T extends HomePropsArgs | null> = T extends HomePropsArgs ? HomeProps : HomeProps | undefined

export class PropsStorageClient {
    private readonly prisma: PrismaClient

    private static readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private static readonly presentationId = new ObjectID("111111111111111111111111").toJSON()
    private static readonly imageUrlPrefix = "data:image/webp;base64"

    static readonly selectSkill = {select: {id: true, name: true, rate: true, image: true}}
    static readonly selectPresentation = {select: {name: true, introduction: true, image: true, skills: this.selectSkill}}
    static readonly selectStory = {select: {id: true, title: true, body: true, state: true}}
    static readonly selectPublishedStory = {...this.selectStory, where: {state: StoryState.PUBLISHED}}
    static readonly selectHomeProps = {select: {stories: this.selectPublishedStory, presentation: this.selectPresentation}}
    static readonly selectEditHomeProps = {select: {stories: this.selectStory, presentation: this.selectPresentation}}

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
            const {skills: {new: newSkills}, ...rest} = args as CreatePresentationArgs
            const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithBufferImage(newSkills)) : undefined
            promise = this.prisma.presentation.create(
                {
                    data: {
                        id: id,
                        ...this.#getEntityWithBufferImage(rest),
                        skills: createManySkills,
                        ...connectOrCreateProps,
                    },
                    ...select
                }
            )
        } else {
            const {
                skills: {delete: deleteSkills, new: newSkills, update: updateSkills},
                ...rest
            } = args as UpdatePresentationArgs
            const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithBufferImage(newSkills)) : undefined
            const updateManySkills = updateSkills && updateSkills.length > 0 ? this.#getUpdateMany(this.#getEntitiesWithBufferImage(updateSkills)) : undefined
            const saveManySkills = {skills: {...createManySkills, ...updateManySkills, ...this.#getDeleteMany(deleteSkills)}}
            const restWithBufferImage = "image" in rest ?  this.#getEntityWithBufferImage(rest as EntityWithBase64Image<string | undefined>): rest as UpdatePresentationWithoutSkillsAndImageArgs

            promise = this.prisma.presentation.update(
                {
                    where: {id: id},
                    data: {...restWithBufferImage, ...saveManySkills},
                    ...select
                }
            )
        }

        return promise.then((p) => this.#getNormalizePresentation(p))
    }

    async setStory(story: NewStory | Story): Promise<Story> {
        const homePropsId = PropsStorageClient.homePropsId
        const presentationId = PropsStorageClient.presentationId

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
                                create: {
                                    id: homePropsId,
                                    presentation: {
                                        connectOrCreate: {
                                            where: {id: presentationId},
                                            create: {id: presentationId, name: "", introduction: ""},
                                        }
                                    }
                                }
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
                                  ...presentationWithoutSkills
                              }, stories: {new: newStories}
                          }: CreateHomePropsArgs) {
        const createManySkills = newSkills && newSkills.length > 0 ? {skills: this.#getCreateMany(this.#getEntitiesWithBufferImage(newSkills))} : undefined
        const createPresentation = {presentation: {create: {id: PropsStorageClient.presentationId, ...this.#getEntityWithBufferImage(presentationWithoutSkills), ...createManySkills}}}

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
        const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithBufferImage(newSkills)) : undefined
        const updateManySkills = updateSkills && updateSkills.length > 0 ? this.#getUpdateMany(this.#getEntitiesWithBufferImage(updateSkills)) : undefined
        const saveManySkills = {skills: {...createManySkills, ...updateManySkills, ...this.#getDeleteMany(deleteSkills)}}
        const presentationRestWithBufferImage = "image" in presentationRest ?  this.#getEntityWithBufferImage(presentationRest as EntityWithBase64Image<string | undefined>): presentationRest as UpdatePresentationWithoutSkillsAndImageArgs
        const presentationUpdate = {presentation: {update: {...presentationRestWithBufferImage, ...saveManySkills}}}
        const saveManyStories = {stories: {...this.#getCreateMany(newStories), ...this.#getUpdateMany(updateStories), ...this.#getDeleteMany(deleteStories)}}

        return this.prisma.props.update(
            {
                where: {id: PropsStorageClient.homePropsId},
                data: {
                    ...presentationUpdate,
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
    #getBufferImage<T extends Base64Image>(base64Image: T) {
        return (base64Image ? Buffer.from(getContainedString(base64Image, ","), "base64") : null) as BufferImageConvert<T>
    }
    #getBase64Image<T extends BufferImage>(imageBuffer: T) {
        return (imageBuffer ? PropsStorageClient.imageUrlPrefix + "," + Buffer.from(imageBuffer).toString("base64") : undefined) as Base64ImageConvert<T>
    }
    #getEntityWithBufferImage<E extends EntityWithBase64Image<Base64Image>>(e: E) {
        return getRecordWithNewProps<E, [["image", BufferImageConvert<E["image"]>]]>(e, [["image", this.#getBufferImage<E["image"]>(e.image)]])
    }
    #getEntitiesWithBufferImage<E extends EntityWithBase64Image<Base64Image>>(entities: E[]) {
        return entities.map(e => this.#getEntityWithBufferImage<E>(e))
    }

    #getEntityWithBase64Image<E extends EntityWithBufferImage<BufferImage>>(e: E) {
        return getRecordWithNewProps<E, [["image", Base64ImageConvert<E["image"]>]]>(e, [["image", this.#getBase64Image<E["image"]>(e.image)]])
    }
    #getEntitiesWithBase64Image<E extends EntityWithBufferImage<BufferImage>>(entities: E[]) {
        return entities.map(e => this.#getEntityWithBase64Image<E>(e))
    }

    #getNormalizePresentation(dbArgs: PresentationArgs): Presentation {
        return this.#getEntityWithBase64Image(getRecordWithNewProps<PresentationArgs, [["skills", Skill[]]]>(dbArgs, [["skills", this.#getEntitiesWithBase64Image(dbArgs.skills)]]))
    }

    /* ----- PRIVATE METHODS TO HELP BUILD QUERIES ----- */
    /*#getCreate<NE extends NewEntity>(entity: NE) {
        return {create: {...entity}}
    }
    #getUpdate<NE extends NewEntity>(entity: NE | undefined, id?: string) {
        const where = id ? {where: {id: id}} : {}
        return {...where, data: entity}
    }*/
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
