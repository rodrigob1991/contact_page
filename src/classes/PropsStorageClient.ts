import {PrismaClient, StoryState} from "@prisma/client"
import {
    CreateHomePropsArgs,
    CreateOrUpdatePresentationArgs,
    CreatePresentationArgs,
    DbOperation,
    HomeProps, HomePropsDbArgs,
    Image,
    ImageDbArgs,
    NewStory,
    Presentation, PresentationDbArgs,
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

type ImageDbArgsOrNull = ImageDbArgs | null
type ImageOrUndefined = Image | undefined
type EntityWithImageDbArgs<T extends ImageDbArgsOrNull> = { image: T }
type ImageConvert<T extends ImageDbArgsOrNull> = T extends ImageDbArgs ? Image : ImageOrUndefined
type EntityWithImage<T extends ImageOrUndefined> = { image: T }
type ImageDbArgsConvert<T extends ImageOrUndefined> = T extends Image ? ImageDbArgs : ImageDbArgsOrNull

type NormalizedHomeProps<T extends HomePropsDbArgs | null> = T extends HomePropsDbArgs ? HomeProps : HomeProps | undefined

export class PropsStorageClient {
    private readonly prisma: PrismaClient

    private static readonly homePropsId = new ObjectID("111111111111111111111111").toJSON()
    private static readonly presentationId = new ObjectID("111111111111111111111111").toJSON()

    static readonly selectSkill = {select: {id: true, name: true, rate: true, image: true, position: true}}
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
            const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithImageDbArgs(newSkills)) : undefined
            promise = this.prisma.presentation.create(
                {
                    data: {
                        id: id,
                        ...this.#getEntityWithImageDbArgs(rest),
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
            const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithImageDbArgs(newSkills)) : undefined
            const updateManySkills = updateSkills && updateSkills.length > 0 ? this.#getUpdateMany(this.#getEntitiesWithImageDbArgs(updateSkills)) : undefined
            const saveManySkills = {skills: {...createManySkills, ...updateManySkills, ...this.#getDeleteMany(deleteSkills)}}
            const restWithImageDbArgs = "image" in rest ?  this.#getEntityWithImageDbArgs(rest as EntityWithImage<ImageOrUndefined>): rest as UpdatePresentationWithoutSkillsAndImageArgs

            promise = this.prisma.presentation.update(
                {
                    where: {id: id},
                    data: {...restWithImageDbArgs, ...saveManySkills},
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
        const createManySkills = newSkills && newSkills.length > 0 ? {skills: this.#getCreateMany(this.#getEntitiesWithImageDbArgs(newSkills))} : undefined
        const createPresentation = {presentation: {create: {id: PropsStorageClient.presentationId, ...this.#getEntityWithImageDbArgs(presentationWithoutSkills), ...createManySkills}}}

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
        const createManySkills = newSkills && newSkills.length > 0 ? this.#getCreateMany(this.#getEntitiesWithImageDbArgs(newSkills)) : undefined
        const updateManySkills = updateSkills && updateSkills.length > 0 ? this.#getUpdateMany(this.#getEntitiesWithImageDbArgs(updateSkills)) : undefined
        const saveManySkills = {skills: {...createManySkills, ...updateManySkills, ...this.#getDeleteMany(deleteSkills)}}
        const presentationRestWithBufferImage = "image" in presentationRest ?  this.#getEntityWithImageDbArgs(presentationRest as EntityWithImage<ImageOrUndefined>): presentationRest as UpdatePresentationWithoutSkillsAndImageArgs
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

    #getNormalizePresentation(dbArgs: PresentationDbArgs): Presentation {
        return this.#getEntityWithImage(getRecordWithNewProps<PresentationDbArgs, [["skills", Skill[]]]>(dbArgs, [["skills", this.#getEntitiesWithImage(dbArgs.skills)]]))
    }
    #getNormalizeHomeProps<T extends HomePropsDbArgs | null>(homeProps: T): NormalizedHomeProps<T> {
        let normalizedHomeProps: Record<string, any> | undefined
        if (homeProps) {
            normalizedHomeProps = {}
            for (const [key, value] of Object.entries(homeProps)) {
                normalizedHomeProps[key] = (value === null ? undefined : key === "presentation" ? this.#getNormalizePresentation(value as PresentationDbArgs) : value)
            }
        } else {
            normalizedHomeProps = undefined
        }
        return normalizedHomeProps as NormalizedHomeProps<T>
    }

    /* ----- PRIVATE METHODS TO MAP DATA FROM DB TO UI AND VICE VERSA ----- */
    #getImageDataUrlPrefix(extension: string) {
        return `data:image/${extension};base64`
    }

    #getImageDbArgs<I extends ImageOrUndefined>(image: I) {
        let imageDbArgs
        if (image) {
            imageDbArgs = getRecordWithNewProps<Image, [["src", Buffer]]>(image, [["src", Buffer.from(getContainedString(image.src, ","), "base64")]])
        } else {
            imageDbArgs = null
        }
        return imageDbArgs as ImageDbArgsConvert<I>
    }

    #getImage<I extends ImageDbArgsOrNull>(imageDbArgs: I) {
        let image
        if (imageDbArgs) {
            image = getRecordWithNewProps<ImageDbArgs, [["src", string]]>(imageDbArgs, [["src", this.#getImageDataUrlPrefix(imageDbArgs.extension) + "," + Buffer.from(imageDbArgs.src).toString("base64")]])
        } else {
            image = undefined
        }
        return image as ImageConvert<I>
    }
    #getEntityWithImageDbArgs<E extends EntityWithImage<ImageOrUndefined>>(e: E) {
        return getRecordWithNewProps<E, [["image", ImageDbArgsConvert<E["image"]>]]>(e, [["image", this.#getImageDbArgs<E["image"]>(e.image)]])
    }
    #getEntitiesWithImageDbArgs<E extends EntityWithImage<ImageOrUndefined>>(entities: E[]) {
        return entities.map(e => this.#getEntityWithImageDbArgs<E>(e))
    }

    #getEntityWithImage<E extends EntityWithImageDbArgs<ImageDbArgsOrNull>>(e: E) {
        return getRecordWithNewProps<E, [["image", ImageConvert<E["image"]>]]>(e, [["image", this.#getImage<E["image"]>(e.image)]])
    }
    #getEntitiesWithImage<E extends EntityWithImageDbArgs<ImageDbArgsOrNull>>(entities: E[]) {
        return entities.map(e => this.#getEntityWithImage<E>(e))
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
