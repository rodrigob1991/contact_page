import styled from "@emotion/styled"
import React, {useEffect, useRef, useState} from "react"
import {
    HomeProps,
    NewStory,
    Presentation,
    PresentationHTMLElementIds,
    Story,
    StoryHTMLElementIds
} from "../../types/Home"
import {revalidatePages} from "../api/revalidate/multiple"
import {RevalidationRouteId} from "../../types/Revalidation"
import {PropsStorageClient} from "../../classes/PropsStorageClient"
import {Button} from "../../components/Buttons"
import {Container} from "../../components/home/Layout"
import PresentationView from "../../components/home/PresentationView"
import StoriesView from "../../components/home/StoriesView"
import {getContainedString} from "../../utils/StringFunctions"
import {putHomeProps} from "../api/props/home";

export const EDITH_HOME_ROUTE = "/user/edit_home"

export async function getServerSideProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()

    return {props: homeProps}
}

export default function EditHome(props?: HomeProps) {
    const emptyPresentation: Presentation = {name: "", introduction: ""}
    const [presentation, setPresentation] = useState(props?.presentation || emptyPresentation)
    const setPresentationProperty = (presentationKey: keyof Presentation, propertyValue: string) => {
        presentation[presentationKey] = propertyValue
    }
    const presentationHtmlElementIdsPrefix = "presentation"
    const presentationHtmlElementIds: PresentationHTMLElementIds = (() => {
        const htmlElementIds: Record<string, string> = {}
        for (const key in emptyPresentation) {
            htmlElementIds[key] = presentationHtmlElementIdsPrefix + "-" + key
        }
        return htmlElementIds as PresentationHTMLElementIds
    })()

    const emptyStory: Story = {id: "", title: "", body: ""}
    const [stories, setStories] = useState(props?.stories || [])
    const updateStories = (storyId: string, key: keyof NewStory, value: string) => {
        const storyToUpdateIndex = stories.findIndex((s) => s.id === storyId)
        stories[storyToUpdateIndex][key] = value
    }
    const [newStories, setNewStories] = useState<NewStory[]>([])
    const updateNewStories = (id: string, key: keyof NewStory, value: string) => {
        const storyToUpdateIndex = getIndexFromNewStoryId(id)
        newStories[storyToUpdateIndex][key] = value
    }
    const getIndexFromNewStoryId = (id: string) => {
        return parseInt(getContainedString(id, "-"))
    }
    const [deleteStories, setDeleteStories] = useState<Story[]>([])
    const onDeleteStory = (id: string) => {
        if (isNewStory(id)) {
            setNewStories((newStories) => {
                const updatedNewStories = [...newStories]
                updatedNewStories.splice(getIndexFromNewStoryId(id), 1)
                return updatedNewStories
            })
        } else {
            const storyToDelete = stories.find((s) => s.id === id) as Story
            setDeleteStories([...deleteStories, storyToDelete])
        }
    }
    const getNewStoryWithId = (s: NewStory, index: number) => {
        return {id: "-" + index, ...s}
    }
    const isNewStory = (id: string) => {
        return id.startsWith("-")
    }
    const storyHtmlElementIdsPrefix = "story"
    const getStoryHtmlElementIds = (storyId: string ) => {
        const htmlElementIds: Record<string, string> = {}
        for (const key in emptyStory) {
            htmlElementIds[key] = `${storyHtmlElementIdsPrefix}{${storyId}}${key}`
        }
        return htmlElementIds as StoryHTMLElementIds
    }

    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updatePresentation = (htmlElementId: string, newPropertyValue: string) => {
            const key = getContainedString(htmlElementId, "-") as keyof Presentation
            setPresentationProperty(key, newPropertyValue)
        }
        const updateStory = (htmlElementId: string, newPropertyValue: string) => {
            const storyId = getContainedString(htmlElementId, "{", "}")
            const key = getContainedString(htmlElementId, "}") as keyof NewStory
            if (isNewStory(storyId)) {
                updateNewStories(storyId, key, newPropertyValue)
            } else {
                updateStories(storyId, key, newPropertyValue)
            }
        }

        const observer = new MutationObserver(
            (mutationList, observer) => {
                for (const mutation of mutationList) {
                    const htmlElement = mutation.target.parentElement
                    if (htmlElement) {
                        const htmlElementId = htmlElement.id
                        const newPropertyValue = mutation.target.textContent as string

                        if (htmlElementId.startsWith(presentationHtmlElementIdsPrefix)) {
                            updatePresentation(htmlElementId, newPropertyValue)
                        } else if (htmlElementId.startsWith(storyHtmlElementIdsPrefix)) {
                            updateStory(htmlElementId, newPropertyValue)
                        }
                        console.table(mutation)
                    }
                }
            })
        observer.observe(ref.current as HTMLElement, {characterData: true, subtree: true})

        return () => observer.disconnect()
    }, [])

    const [storageResultMessage, setStorageResultMessage] = useState("")
    const storeHomeProps = (e: React.MouseEvent<HTMLButtonElement>) => {
        putHomeProps({presentation: presentation, stories: {new: newStories, delete: deleteStories}})
            .then(({succeed, homeProps: {presentation, stories} = {}, errorMessage}) => {
                let resultMessage = ""
                if (succeed) {
                    resultMessage = "home props successfully stored"
                    setPresentation(presentation || emptyPresentation)
                    setStories(stories || [])
                    setNewStories([])
                    setDeleteStories([])
                } else {
                    resultMessage = errorMessage || "home props could not be stored"
                }
                setStorageResultMessage(resultMessage)
            })
    }

    const revalidateHomeProps = async (e: React.MouseEvent<HTMLButtonElement>) => {
        revalidatePages([RevalidationRouteId.HOME])
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
            )
    }
    const [revalidationResultMessage, setRevalidationResultMessage] = useState("")

    return (
        <Container ref={ref}>
            <PresentationView editing htmlElementIds={presentationHtmlElementIds} presentation={presentation}/>
            <StoriesView editing stories={stories} newStories={newStories} getHtmlElementIds={getStoryHtmlElementIds}
                         getNewStoryWithId={getNewStoryWithId} onDeleteStory={onDeleteStory}/>
            {/*<PresentationForm onSubmit={handleSavePresentation}>
                <TextInput width={300} value={presentation.name}
                           setValue={(value) => setPresentationProperty("name", value)}/>
                <TextAreaInput height={400} width={1000} value={presentation.introduction}
                               setValue={(value) => setPresentationProperty("introduction", value)}/>
                <Button type={"submit"}> SAVE PRESENTATION </Button>
                {editPresentationMessage}
            </PresentationForm>*/}
           {/* <StoryContainer>
                <EditStoryForm onSubmit={handleSavedStory}>
                    <EditStoryDataContainer>
                        <TextInput width={300} value={selectedStory.title}
                                   setValue={(value) => setStoryProperty("title", value)}/>
                        <TextAreaWithImages height={350} width={700} value={selectedStory.body}
                                            setValue={(value) => setStoryProperty("body", value)}
                                            imageMaxSize={10} processNewImage={queueStoryImage}
                                            processRemovedImage={removeStoryImage}/>
                        {editStoryMessage}
                    </EditStoryDataContainer>
                    <EditStoryButtonsContainer>
                        <Button type={"submit"}> {creatingStory ? "create" : "update"} </Button>
                        {!creatingStory ?
                            <>
                                <Button onClick={handleNewStory}> new </Button>
                                <Button onClick={handleDeleteStory}> delete </Button>
                            </>
                            : ""
                        }
                    </EditStoryButtonsContainer>

                </EditStoryForm>
                <StoryTable>
                    <StoryTableTitle>Stories</StoryTableTitle>
                    {stories.map((s) => (
                        <StoryRow key={s.id} onClick={(e) => handleStorySelection(e, s)}>
                            <StoryColumn> {s.title}</StoryColumn> </StoryRow>
                    ))}
                </StoryTable>
            </StoryContainer>*/}
            <ButtonsContainer>
                <Button onClick={storeHomeProps}> STORE </Button>
                <Button onClick={revalidateHomeProps}> REVALIDATE </Button>
            </ButtonsContainer>
            <OperationMessagesContainer>
                <OperationMessage>{storageResultMessage}</OperationMessage>
                <OperationMessage>{revalidationResultMessage}</OperationMessage>
            </OperationMessagesContainer>
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
const StoryContainer = styled.div`
  align-items: left;
  display: flex;
  flex-direction: column;
  background-color: #B0C4DE;
  gap: 20px;
  padding: 50px;
`
const EditStoryForm = styled.form`
  align-items: center;
  display: flex;
  flex-direction: row;
  background-color:;
  gap: 15px;
`
const EditStoryDataContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color:;
  gap: 15px;
`
const EditStoryButtonsContainer = styled.div`
  align-items: left;
  display: flex;
  flex-direction: column;
  gap: 15px;
`
const StoryTable = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color: #B0C4DE;
  gap: 5px;
`
const StoryTableTitle = styled.text`
  color: #4682B4;
  text-decoration-color: #4682B4;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
    `

const StoryRow = styled.div`
  align-items: left;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  font-weight: bold;
`
const StoryColumn = styled.div`
  border-style: solid;
  border-color: #4682B4;
`