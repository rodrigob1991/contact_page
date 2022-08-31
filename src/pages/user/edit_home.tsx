import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {
    HomeProps,
    NewStory,
    NewStoryPropertiesType,
    Presentation,
    PresentationHTMLElementIds,
    PresentationWithoutImage,
    Story,
    StoryHTMLElementIds
} from "../../types/Home"
import {revalidatePages} from "../api/revalidate/multiple"
import {RevalidationRouteId} from "../../types/Revalidation"
import {PropsStorageClient} from "../../classes/PropsStorageClient"
import {Button} from "../../components/Buttons"
import {Container, Footer} from "../../components/home/Layout"
import PresentationView from "../../components/home/PresentationView"
import StoriesView from "../../components/home/StoriesView"
import {getContainedString} from "../../utils/StringFunctions"
import {putHomeProps} from "../api/props/home"
import {SpinLoader} from "../../components/Loaders"
import {StoryState} from "@prisma/client"
import {lookUpParent} from "../../utils/DomManipulations"

export const EDITH_HOME_ROUTE = "/user/edit_home"

export async function getServerSideProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getEditHomeProps()

    return {props: props}
}

export default function EditHome(props?: HomeProps) {
    const emptyPresentation: Presentation = {name: "", introduction: "", image: undefined}
    const presentation = useRef(props?.presentation || emptyPresentation)
    const getPresentation = () => presentation.current
    const setPresentation = (p: Presentation) => {
        presentation.current = p
    }
    const setPresentationProperty = (presentationKey: keyof Presentation, propertyValue: string) => {
        getPresentation()[presentationKey] = propertyValue
    }
    const setPresentationImage = (imageDataUrl: string) => {
        setPresentationProperty("image", imageDataUrl)
    }
    const presentationHtmlElementIdsPrefix = "presentation"
    const presentationHtmlElementIds: PresentationHTMLElementIds = (() => {
        const htmlElementIds: Record<string, string> = {}
        for (const key in emptyPresentation) {
            htmlElementIds[key] = presentationHtmlElementIdsPrefix + "-" + key
        }
        return htmlElementIds as PresentationHTMLElementIds
    })()

    const emptyStory: Story = {id: "", state : StoryState.UNPUBLISHED, title: "", body: ""}

    const savedStories = useRef<Story[]>(props?.stories || [])
    const getSavedStories = () => savedStories.current
    const setSavedStories = (ns: Story[]) => {
        savedStories.current = ns
    }
    const removeSavedStory = (id: string) => {
        const index = getSavedStories().findIndex((s) => s.id === id)
        getSavedStories().splice(index, 1)
    }
    const updateSavedStory = (storyId: string, key: keyof NewStory, value: NewStoryPropertiesType) => {
        const storyToUpdateIndex = getSavedStories().findIndex((s) => s.id === storyId)
        // @ts-ignore
        getSavedStories()[storyToUpdateIndex][key] = value
    }
    const newStoryIdPrefix = "-"
    const newStories = useRef<(NewStory | null)[]>([])
    const getNewStories = () => newStories.current
    const setNewStories = (ns: NewStory[]) => {
        newStories.current = ns
    }
    const removeNewStory = (id: string) => {
        getNewStories().splice(getIndexFromNewStoryId(id), 1, null)
    }
    const getNotNullsNewStories = () => {
        const isNoNull = (s: NewStory | null): s is NewStory => s !== null
        return getNewStories().filter(isNoNull)
    }
    const updateNewStory = (id: string, key: keyof NewStory, value: NewStoryPropertiesType) => {
        const index = getIndexFromNewStoryId(id)
        // @ts-ignore
        getNewStories()[index][key] = value
    }
    const createNewStory = (): [string, NewStory] => {
        const newStory = {state: StoryState.UNPUBLISHED, title: "title", body: "<div> body </div>"}
        const id = newStoryIdPrefix + (getNewStories().push(newStory) - 1)
        return [id, newStory]
    }
    const isNewStory = (id: string) => {
        return id.startsWith(newStoryIdPrefix)
    }
    const getIndexFromNewStoryId = (id: string) => {
        return parseInt(getContainedString(id, newStoryIdPrefix))
    }
    const deleteStoriesId = useRef<string[]>([])
    const getDeleteStoriesId = () => deleteStoriesId.current
    const setDeleteStoriesId = (ids: string[]) => {
        deleteStoriesId.current = ids
    }
    const addDeleteStoryId = (id: string) => {
        getDeleteStoriesId().push(id)
    }
    const removeDeleteStoryId = (id: string) => {
        getDeleteStoriesId().splice(getDeleteStoriesId().findIndex((id) => id === id), 1)
    }
    const deleteStory = (id: string) => {
        if (isNewStory(id)) {
            removeNewStory(id)
        } else {
            addDeleteStoryId(id)
        }
    }
    const recoverStory = (id: string) => {
        removeDeleteStoryId(id)
    }
    const storyHtmlElementIdsPrefix = "story"
    const getStoryHtmlElementIds = (storyId: string) => {
        const htmlElementIds: Record<string, string> = {}
        for (const key in emptyStory) {
            htmlElementIds[key] = `${storyHtmlElementIdsPrefix}{${storyId}}${key}`
        }
        return htmlElementIds as StoryHTMLElementIds
    }

    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updatePresentation = (htmlElementId: string, newPropertyValue: string) => {
            const key = getContainedString(htmlElementId, "-") as keyof PresentationWithoutImage
            setPresentationProperty(key, newPropertyValue)
        }
        const updateStory = (htmlElementId: string, newPropertyValue: string) => {
            const storyId = getContainedString(htmlElementId, "{", "}")
            const key = getContainedString(htmlElementId, "}") as keyof NewStory
            if (isNewStory(storyId)) {
                updateNewStory(storyId, key, newPropertyValue)
            } else {
                updateSavedStory(storyId, key, newPropertyValue)
            }
        }
        const observer = new MutationObserver(
            (mutationList, observer) => {
                for (const mutation of mutationList) {
                    const seekParentTill = (p: ParentNode) => {
                        let stop
                        if (p instanceof HTMLDivElement || p instanceof HTMLSpanElement) {
                            stop = p.id.startsWith(presentationHtmlElementIdsPrefix) || p.id.startsWith(storyHtmlElementIdsPrefix);
                        } else if (p instanceof HTMLAnchorElement) {
                            stop = false
                        } else {
                            stop = true
                        }
                        return stop
                    }
                    const htmlElement = lookUpParent(mutation.target, seekParentTill)
                    if (htmlElement && (htmlElement instanceof HTMLDivElement || htmlElement instanceof HTMLSpanElement)) {
                        const htmlElementId = htmlElement.id
                        const newPropertyValue = htmlElement.innerHTML as string
                        console.log(newPropertyValue)

                        if (htmlElementId.startsWith(presentationHtmlElementIdsPrefix)) {
                            updatePresentation(htmlElementId, newPropertyValue)
                        } else if (htmlElementId.startsWith(storyHtmlElementIdsPrefix)) {
                            updateStory(htmlElementId, newPropertyValue)
                        }
                    }
                }
            })
        observer.observe(ref.current as HTMLElement, {characterData: true, subtree: true, childList:true, attributeFilter: ["href", "src"]})

        return () => observer.disconnect()
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
        prepareApiCall(putHomeProps({
            presentation: getPresentation(),
            stories: {
                update: getSavedStories().filter((s)=> !(getDeleteStoriesId().some((id)=> id === s.id))),
                delete: getDeleteStoriesId(),
                new: getNotNullsNewStories()
            }
        }).then(({succeed, homeProps: {presentation, stories} = {}, errorMessage}) => {
            let resultMessage
            if (succeed) {
                resultMessage = "home props successfully stored"
                setPresentation(presentation || emptyPresentation)
                setSavedStories(stories || [])
                setNewStories([])
                setDeleteStoriesId([])
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
        <Container ref={ref}>
            <SpinLoader show={loading}/>
            <PresentationView editing htmlElementIds={presentationHtmlElementIds} presentation={presentation.current} setPresentationImage={setPresentationImage}/>
            <StoriesView editing stories={getSavedStories()} getHtmlElementIds={getStoryHtmlElementIds}
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