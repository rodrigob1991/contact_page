import styled from "@emotion/styled"
import { StoryState } from "@prisma/client"
import React, { MouseEventHandler, useEffect, useRef, useState } from "react"
import { getContainedString } from "utils/src/strings"
import { AnyPropertiesCombination } from "utils/src/types"
import { UserBaseRoute } from "../../baseRoutes"
import { PropsStorageClient } from "../../classes/PropsStorageClient"
import { Button } from "../../components/Buttons"
import { SpinLoader } from "../../components/Loaders"
import { Footer } from "../../components/home/Layout"
import PresentationView, { GetHtmlElementId as GetPresentationHtmlElementId } from "../../components/home/presentation/PresentationView"
import StoriesView from "../../components/home/stories/StoriesView"
import { skillsChartLayout } from "../../layouts"
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
import { RevalidationRouteId } from "../../types/revalidation"
import { lookUpParent } from "../../utils/domManipulations"
import { patchHomeProps, postHomeProps } from "../api/protected/props/home"
import { revalidatePages } from "../api/protected/revalidate/multiple"

export const EditHomeRoute = UserBaseRoute + "/edit_home"

export async function getServerSideProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getEditHomeProps()

    // json parser is use to don`t serialize undefined values, Next.js throw an error otherwise.
    return {props: JSON.parse(JSON.stringify(props)) as HomeProps}
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
    const refToRemoveSkillsIds = useRef<string[]>([])
    const getRemoveSkillsIds = () => refToRemoveSkillsIds.current
    const setRemoveSkillsIds = (ids: string[]) => {
        refToRemoveSkillsIds.current = ids
    }
    const addRemoveSkillsId = (id: string) => {
        getRemoveSkillsIds().push(id)
    }
    const removeSkill = (id: string) => {
        if (isNewEntity(id)) {
            getNewSkills().splice(getIndexFromNewEntityId(id), 1, null)
        } else {
            addRemoveSkillsId(id)
        }
    }
    const getUpdateSkills = () => getPresentation().skills.filter((s) => !(getRemoveSkillsIds().some((id) => id === s.id)))

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
    /* const [savedStories, setSavedStories] = useState<Story[]>(props?.stories || [])
    const getSavedStories = () => savedStories
    const mutateSavedStory = <K extends keyof NewStory>(storyId: string, key: K, value: Story[K]) => {
        setSavedStories(savedStories => {
            const nextSavedStories = [... savedStories]
            const i = savedStories.findIndex((s) => s.id === storyId)
            const s = {...savedStories[i]}
            s[key] = value
            nextSavedStories[i] = s
            console.log(s)
            return nextSavedStories
        })
    } */

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
        const index = getNewStories().length
        const newStory = {state: StoryState.UNPUBLISHED, title: "new story" + (index + 1), body: "<div> body </div>"}
        const id = newEntityIdPrefix + index
        getNewStories().push(newStory)
        return [id, newStory]
    }
    const mutateNewStory = <K extends keyof NewStory>(id: string, key: K, value: NewStory[K]) => {
        const index = getIndexFromNewEntityId(id);
        (getNewStories()[index] as NewStory)[key] = value
    }
    const removeNewStory = (id: string) => {
        getNewStories().splice(getIndexFromNewEntityId(id), 1, null)
    }

    const refToRemoveStoriesIds = useRef<string[]>([])
    const getRemoveStoriesIds = () => refToRemoveStoriesIds.current
    const setRemoveStoriesIds = (ids: string[]) => {
        refToRemoveStoriesIds.current = ids
    }
    const addRemoveStoryId = (id: string) => {
        getRemoveStoriesIds().push(id)
    }
    const removeRemoveStoryId = (id: string) => {
        getRemoveStoriesIds().splice(getRemoveStoriesIds().indexOf(id), 1)
    }
    const removeStory = (id: string) => {
        if (isNewEntity(id)) {
            removeNewStory(id)
        } else {
            addRemoveStoryId(id)
        }
    }
    const recoverStory = (id: string) => {
        removeRemoveStoryId(id)
    }
    const getUpdateStories = () =>
        getSavedStories().filter((s) => !(getRemoveStoriesIds().some((id) => id === s.id)))

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
                    const newRate = Math.round((resize.borderBoxSize[0].blockSize) * 100 / (skillsChartLayout.barMaxHeight))
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
        promise.finally(() => {setLoading(false)})
    }

    const [storageResultMessage, setStorageResultMessage] = useState("")
    const storeHomeProps: MouseEventHandler<HTMLButtonElement> = (e) => {
        prepareApiCall(isCreateHomeProps ?
                               postHomeProps({
                                   presentation: { ...getPresentation(), skills: {new: getNotNullsNewSkills()}},
                                   stories: {new: getNotNullsNewStories()}
                                }) :
                                patchHomeProps({
                                    presentation: { ...getPresentation(),
                                                  skills: {new: getNotNullsNewSkills(), update: getUpdateSkills(), delete: getRemoveSkillsIds()}
                                    },
                                    stories: {
                                        update: getUpdateStories(),
                                        delete: getRemoveStoriesIds(),
                                        new: getNotNullsNewStories()
                                }
        }).then(({succeed, homeProps: {presentation, stories} = {}, errorMessage}) => {
            let resultMessage
            if (succeed) {
                resultMessage = "home props successfully stored"
                setPresentation(presentation || emptyPresentation)
                setNewSkills([])
                setRemoveSkillsIds([])
                setSavedStories(stories || [])
                setNewStories([])
                setRemoveStoriesIds([])
            } else {
                resultMessage = errorMessage || "home props could not be stored"
            }
            setStorageResultMessage(resultMessage)
        }).finally(() => {setLoading(false)}))
    }

    const revalidateHomeProps: MouseEventHandler<HTMLButtonElement> = (e) => {
        prepareApiCall(revalidatePages([RevalidationRouteId.HOME])
            .then(({
                       succeed,
                       revalidations,
                       errorMessage
                   }) => {
                    if (succeed) {
                        //there must always be revalidations here
                        if (revalidations) {
                            setRevalidationResultMessage(revalidations.map(r => r.routeId + ":" + r.message).toString())
                        }
                    } else {
                        setRevalidationResultMessage(errorMessage || "there must be always an error message")
                    }
                }
            ))
    }
    const [revalidationResultMessage, setRevalidationResultMessage] = useState("")

    return <div ref={refToMutationObserverTarget}>
           <SpinLoader show={loading}/>
           <PresentationView editing observe={observe} getHtmlElementId={getPresentationHtmlElementId} presentation={getPresentation()}
                             createSkill={createNewSkill} removeSkill={removeSkill}/>
           <StoriesView viewMode="editing" observe={observe} savedStories={getSavedStories()} getHtmlElementIds={getStoryHtmlElementIds}
                        createNewStory={createNewStory} removeStory={removeStory} recoverStory={recoverStory}/>
           <Footer>
           <ButtonsContainer>
           <Button disabled={loading} onClick={storeHomeProps}> STORE </Button>
           <Button disabled={loading} onClick={revalidateHomeProps}> REVALIDATE </Button>
           </ButtonsContainer>
           <OperationMessagesContainer>
           {storageResultMessage && <OperationMessage>{storageResultMessage}</OperationMessage>}
           {revalidationResultMessage && <OperationMessage>{revalidationResultMessage}</OperationMessage>}
           </OperationMessagesContainer>
           </Footer>
           </div>
}

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 20px;
  gap: 20px;
`
const OperationMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`
const OperationMessage = styled.text`
  font-weight: bold;
  font-size: 20px;
  color: #00008B;
    `