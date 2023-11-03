import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {
    HomeProps,
    Image,
    NewSkill,
    NewStory,
    Presentation,
    PresentationWithoutImage,
    Skill,
    Story,
    StoryHTMLElementIds
} from "../../types/home"
import {revalidatePages} from "../api/protected/revalidate/multiple"
import {RevalidationRouteId} from "../../types/revalidation"
import {PropsStorageClient} from "../../classes/PropsStorageClient"
import {Button} from "../../components/Buttons"
import {Container, Footer} from "../../components/home/Layout"
import PresentationView, {GetHtmlElementId as GetPresentationHtmlElementId} from "../../components/home/presentation/PresentationView"
import StoriesView from "../../components/home/stories/StoriesView"
import {getContainedString} from "utils/src/strings"
import {patchHomeProps, postHomeProps} from "../api/protected/props/home"
import {SpinLoader} from "../../components/Loaders"
import {StoryState} from "@prisma/client"
import {AnyPropertiesCombination} from "utils/src/types"
import {lookUpParent} from "../../utils/domManipulations"
import {containerStyles as skillsChartContainerStyles} from "../../components/home/presentation/SkillsChart"
import {UserBaseRoute} from "../../baseRoutes"

export const EditHomeRoute = UserBaseRoute + "/edit_home"

export async function getServerSideProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getEditHomeProps()

    // json parser is use to don`t serialize undefined values, Next.js throw an error otherwise.
    return {props: JSON.parse(JSON.stringify(props))}
}

export type Observe = (element: HTMLElement, observeWhat: AnyPropertiesCombination<{ mutation: MutationObserverInit | "default", resize: ResizeObserverOptions | "default" }>) => void

export default function EditHome(props?: HomeProps) {
    const isCreateHomeProps = props === undefined

    const newEntityIdPrefix = "-"
    const isNewEntity = (id: string) => {
        return id.startsWith(newEntityIdPrefix)
    }
    const getIndexFromNewEntityId = (id: string) => {
        return parseInt(getContainedString(id, newEntityIdPrefix))
    }

    const emptyImage: Image = {extension: "", name: "", src: ""}
    const emptyPresentation: Presentation = {name: "", introduction: "", skills: [], image: emptyImage}
    const refToPresentation = useRef<Presentation>(props?.presentation || emptyPresentation)
    const getPresentation = () => refToPresentation.current
    const setPresentation = (p: Presentation) => {
        refToPresentation.current = p
    }
    const mutatePresentation = <K extends keyof Presentation>(key: K, value: Presentation[K]) => {
        getPresentation()[key] = value
    }

    const mutateNewSkill = <K extends keyof NewSkill>(id: string, key: K, value: NewSkill[K]) => {
        (getNewSkills()[getIndexFromNewEntityId(id)] as NewSkill)[key] = value
    }
    const mutateSavedSkill = <K extends keyof Skill>(id: string, key: K, value: Skill[K]) => {
        getPresentation().skills[getPresentation().skills.findIndex((s) => s.id === id)][key] = value
    }
    const refToNewSkills = useRef<(NewSkill | null)[]>([])
    const getNewSkills = () => refToNewSkills.current
    const setNewSkills = (ns: NewSkill[]) => {
        refToNewSkills.current = ns
    }
    const getNotNullsNewSkills = () => {
        const isNoNull = (s: NewSkill | null): s is NewSkill => s !== null
        return getNewSkills().filter(isNoNull)
    }
    const createNewSkill = (): [string, NewSkill] => {
        let position = 0
        getNotNullsNewSkills().concat(getUpdateSkills()).forEach(s => position = s.position > position ? s.position : position)
        const newSkill = {name: "new skill", rate: 50, image: emptyImage, position: position + 1}
        const id = newEntityIdPrefix + (getNewSkills().push(newSkill) - 1)
        return [id, newSkill]
    }
    const refToDeleteSkillsIds = useRef<string[]>([])
    const getDeleteSkillsIds = () => refToDeleteSkillsIds.current
    const setDeleteSkillsIds = (ids: string[]) => {
        refToDeleteSkillsIds.current = ids
    }
    const addDeleteSkillsId = (id: string) => {
        getDeleteSkillsIds().push(id)
    }
    const deleteSkill = (id: string) => {
        if (isNewEntity(id)) {
            getNewSkills().splice(getIndexFromNewEntityId(id), 1, null)
        } else {
            addDeleteSkillsId(id)
        }
    }
    const getUpdateSkills = () => getPresentation().skills.filter((s) => !(getDeleteSkillsIds().some((id) => id === s.id)))

    const presentationHtmlElementIdPrefix = "presentation"
    const getPresentationHtmlElementId: GetPresentationHtmlElementId = (key, skillId) => {
        let htmlElementId = presentationHtmlElementIdPrefix + "-" + key
        switch (key) {
            case "introduction":
            case "name" :
                break
            case "skills":
                htmlElementId += `{${skillId}}`
                break
            default:
                throw new Error("typescript should realize that all the cases are cover")
        }
        return htmlElementId
    }

    const emptyStory: Story = {id: "", state : StoryState.UNPUBLISHED, title: "", body: ""}

    const refToSavedStories = useRef<Story[]>(props?.stories || [])
    const getSavedStories = () => refToSavedStories.current
    const setSavedStories = (ns: Story[]) => {
        refToSavedStories.current = ns
    }
    const mutateSavedStory = <K extends keyof NewStory>(storyId: string, key: K, value: Story[K]) => {
        const storyToUpdateIndex = getSavedStories().findIndex((s) => s.id === storyId)
        getSavedStories()[storyToUpdateIndex][key] = value
    }

    const newStories = useRef<(NewStory | null)[]>([])
    const getNewStories = () => newStories.current
    const setNewStories = (ns: NewStory[]) => {
        newStories.current = ns
    }
    const getNotNullsNewStories = () => {
        const isNoNull = (s: NewStory | null): s is NewStory => s !== null
        return getNewStories().filter(isNoNull)
    }
    const createNewStory = (): [string, NewStory] => {
        const newStory = {state: StoryState.UNPUBLISHED, title: "title", body: "<div> body </div>"}
        const id = newEntityIdPrefix + (getNewStories().push(newStory) - 1)
        return [id, newStory]
    }
    const mutateNewStory = <K extends keyof NewStory>(id: string, key: K, value: NewStory[K]) => {
        const index = getIndexFromNewEntityId(id);
        (getNewStories()[index] as NewStory)[key] = value
    }
    const deleteNewStory = (id: string) => {
        getNewStories().splice(getIndexFromNewEntityId(id), 1, null)
    }

    const refToDeleteStoriesIds = useRef<string[]>([])
    const getDeleteStoriesIds = () => refToDeleteStoriesIds.current
    const setDeleteStoriesIds = (ids: string[]) => {
        refToDeleteStoriesIds.current = ids
    }
    const addDeleteStoryId = (id: string) => {
        getDeleteStoriesIds().push(id)
    }
    const deleteDeleteStoryId = (id: string) => {
        getDeleteStoriesIds().splice(getDeleteStoriesIds().findIndex((id) => id === id), 1)
    }
    const deleteStory = (id: string) => {
        if (isNewEntity(id)) {
            deleteNewStory(id)
        } else {
            addDeleteStoryId(id)
        }
    }
    const recoverStory = (id: string) => {
        deleteDeleteStoryId(id)
    }
    const getUpdateStories = () =>
        getSavedStories().filter((s) => !(getDeleteStoriesIds().some((id) => id === s.id)))

    const storyHtmlElementIdPrefix = "story"
    const getStoryHtmlElementIds = (storyId: string) => {
        const htmlElementIds: Record<string, string> = {}
        for (const key in emptyStory) {
            htmlElementIds[key] = `${storyHtmlElementIdPrefix}{${storyId}}${key}`
        }
        return htmlElementIds as StoryHTMLElementIds
    }

    const refToMutationObserverTarget = useRef<HTMLDivElement>(null)

    const [observe, setObserve] = useState<Observe>(()=> ()=> {})

    useEffect(() => {
        const handleMutatedOrResizedSkillHTMLElement = <K extends keyof NewSkill>(htmlElementId: string, key: K,  newPropertyValue: Skill[K]) => {
            const skillId = getContainedString(htmlElementId, "{", "}")
            if (isNewEntity(skillId)) {
                mutateNewSkill(skillId, key, newPropertyValue)
            } else {
                mutateSavedSkill(skillId, key, newPropertyValue)
            }
        }
        const handleMutatedPresentationHTMLElement = (htmlElementId: string, newPropertyValue: string) => {
            const key = getContainedString(htmlElementId, "-")
            if (key.startsWith("skills")) {
                //handleMutatedOrResizedSkillHTMLElement(htmlElementId,"image",  newPropertyValue)
            } else {
                mutatePresentation(key as keyof PresentationWithoutImage, newPropertyValue)
            }
        }
        const handleMutatedStoryHTMLElement = (htmlElementId: string, newPropertyValue: string) => {
            const storyId = getContainedString(htmlElementId, "{", "}")
            const key = getContainedString(htmlElementId, "}") as keyof NewStory
            if (isNewEntity(storyId)) {
                mutateNewStory(storyId, key, newPropertyValue)
            } else {
                mutateSavedStory(storyId, key, newPropertyValue)
            }
        }

        const isTargetElement = (node: Node) => node instanceof HTMLElement && (node.id.startsWith(presentationHtmlElementIdPrefix) || node.id.startsWith(storyHtmlElementIdPrefix))

        const mutationObserver = new MutationObserver(
            (mutations, observer) => {
                for (const mutation of mutations) {
                    const targetMutation = mutation.target
                    if (!targetMutation.isConnected) {
                        continue
                    }
                    const targetElement = isTargetElement(targetMutation) ? targetMutation
                        : lookUpParent(targetMutation, (p: ParentNode) => isTargetElement(p))

                    if (!targetElement || !isTargetElement(targetElement)) {
                        throw Error("this should not happen")
                    }

                    const {id, innerHTML} = targetElement as HTMLElement
                    console.log(innerHTML)

                    if (id.startsWith(presentationHtmlElementIdPrefix)) {
                        handleMutatedPresentationHTMLElement(id, innerHTML)
                    } else {
                        handleMutatedStoryHTMLElement(id, innerHTML)
                    }
                }
            })

        const resizeObserver = new ResizeObserver((resizes, observer) => {
            for (const resize of resizes) {
                const resizeTarget = resize.target as HTMLElement
                // can be no connected when removing
                if (resizeTarget.isConnected) {
                    const newRate = Math.round((resize.borderBoxSize[0].blockSize) * 100 / (skillsChartContainerStyles.height))
                    console.log(newRate)
                    handleMutatedOrResizedSkillHTMLElement(resizeTarget.id, "rate", newRate)
                }
            }
        })
        const observe: Observe = (element, observeWhat) => {
            if ("mutation" in observeWhat) {
                const options = observeWhat.mutation
                mutationObserver.observe(element, options === "default" ? {characterData: true, subtree: true} : options)
            }
            if ("resize" in observeWhat) {
                const options = observeWhat.resize
                resizeObserver.observe(element, options === "default" ? {box: "border-box"} : options)
            }
        }
        setObserve((current: Observe) => observe)

        return () => {
            mutationObserver.disconnect()
            resizeObserver.disconnect()
        }
    }, [])

    const [loading, setLoading] = useState(false)
    const prepareApiCall = (promise: Promise<any>) => {
        setStorageResultMessage("")
        setRevalidationResultMessage("")
        setLoading(true)
        promise.finally(() => setLoading(false))
    }

    const [storageResultMessage, setStorageResultMessage] = useState("")
    const storeHomeProps = (e: React.MouseEvent<HTMLButtonElement>) => {
        prepareApiCall(isCreateHomeProps ?
                               postHomeProps({
                                   presentation: { ...getPresentation(), skills: {new: getNotNullsNewSkills()}},
                                   stories: {new: getNotNullsNewStories()}
                                }) :
                                patchHomeProps({
                                    presentation: { ...getPresentation(),
                                                  skills: {new: getNotNullsNewSkills(), update: getUpdateSkills(), delete: getDeleteSkillsIds()}
                                    },
                                    stories: {
                                        update: getUpdateStories(),
                                        delete: getDeleteStoriesIds(),
                                        new: getNotNullsNewStories()
                                }
        }).then(({succeed, homeProps: {presentation, stories} = {}, errorMessage}) => {
            let resultMessage
            if (succeed) {
                resultMessage = "home props successfully stored"
                setPresentation(presentation || emptyPresentation)
                setNewSkills([])
                setDeleteSkillsIds([])
                setSavedStories(stories || [])
                setNewStories([])
                setDeleteStoriesIds([])
            } else {
                resultMessage = errorMessage || "home props could not be stored"
            }
            setStorageResultMessage(resultMessage)
        }).finally(() => setLoading(false)))
    }

    const revalidateHomeProps = (e: React.MouseEvent<HTMLButtonElement>) => {
        prepareApiCall(revalidatePages([RevalidationRouteId.HOME])
            .then(({
                       succeed,
                       revalidations,
                       errorMessage
                   }) => {
                    if (succeed) {
                        //there must always be revalidations here
                        if (revalidations) {
                            const message = revalidations.map(r => r.routeId + ":" + r.message).toString()
                            setRevalidationResultMessage(message)
                        }
                    } else {
                        setRevalidationResultMessage(errorMessage || "there must be always an error message")
                    }
                }
            ))
    }
    const [revalidationResultMessage, setRevalidationResultMessage] = useState("")

    return (
        <Container ref={refToMutationObserverTarget}>
            <SpinLoader show={loading}/>
            <PresentationView editing observe={observe} getHtmlElementId={getPresentationHtmlElementId} presentation={getPresentation()}
                              createSkill={createNewSkill} deleteSkill={deleteSkill}/>
            <StoriesView editing observe={observe} stories={getSavedStories()} getHtmlElementIds={getStoryHtmlElementIds}
                         createNewStory={createNewStory} deleteStory={deleteStory} recoverStory={recoverStory}/>
            <Footer>
                <ButtonsContainer>
                    <Button disabled={loading} onClick={storeHomeProps}> STORE </Button>
                    <Button disabled={loading} onClick={revalidateHomeProps}> REVALIDATE </Button>
                </ButtonsContainer>
                <OperationMessagesContainer>
                    <OperationMessage>{storageResultMessage}</OperationMessage>
                    <OperationMessage>{revalidationResultMessage}</OperationMessage>
                </OperationMessagesContainer>
            </Footer>
        </Container>
    )
}

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding-top: 20px;
  gap: 20px;
`
const OperationMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 10px;
`
const OperationMessage = styled.text`
  font-weight: bold;
  font-size: 20px;
  color: #00008B;
    `