import styled from "@emotion/styled"
import React, {FormEvent, useState} from "react"
import {HomeComponentProps, PresentationComponent, StoryComponent} from "../../types/Home"
import {revalidatePages} from "../api/revalidate/multiple"
import {RevalidationRouteId} from "../../types/Revalidation"
import {PropsStorageClient} from "../../../classes/Props"
import {putPresentation} from "../api/props/home/presentation"
import {deleteStory, putStory} from "../api/props/home/story"
import {TextAreaInput, TextInput} from "../../components/FormComponents"
import {Button} from "../../components/Buttons"

export const EDITH_HOME_ROUTE = "/user/edit_home"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()

    return {props: homeProps}
}

const emptyStory = {id: undefined, title: "", body: ""}
const emptyPresentation = {id: undefined, name: "", introduction: ""}

export default function EditHome(props: HomeComponentProps | null) {
    const [presentation, setPresentation] = useState(props?.presentation || emptyPresentation)
    const setPresentationProperty = (presentationKey: keyof PresentationComponent, propertyValue: string) => {
        setPresentation((presentation) => {
            const updatedPresentation = {...presentation}
            updatedPresentation[presentationKey] = propertyValue
            return updatedPresentation
        })
    }
    const handleSavePresentation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const operation = presentation.id ? "UPDATE" : "CREATE"

        putPresentation(presentation).then(({succeed, presentation, errorMessage}) => {
                if (succeed) {
                    setEditPresentationMessage(`presentation ${operation}D`)
                    if (presentation) {
                        setPresentation(presentation)
                    }
                } else {
                    setEditPresentationMessage(errorMessage || `could not ${operation} the presentation`)
                }
            }
        )
    }
    const [editPresentationMessage, setEditPresentationMessage] = useState("")

    const [stories, setStories] = useState(props?.stories || [])
    const [selectedStory, setSelectedStory] = useState<StoryComponent>(emptyStory)
    const creatingStory = selectedStory.id === undefined
    const handleStorySelection = (e: React.MouseEvent<HTMLDivElement>, story: StoryComponent) => {
        e.preventDefault()
        setSelectedStory(story)
    }
    const setStoryProperty = (storyKey: keyof StoryComponent, propertyValue: string) => {
        setSelectedStory((story) => {
            const updatedStory = {...story}
            updatedStory[storyKey] = propertyValue
            return updatedStory
        })
    }
    const handleSavedStory = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const isCreate = selectedStory.id === undefined
        const operation = isCreate ? "CREATE" : "UPDATE"

        putStory(selectedStory).then(({succeed, story, errorMessage}) => {
                if (succeed) {
                    setEditStoryMessage(`story ${operation}D`)
                    if (story) {
                        setSelectedStory(story)
                        const updatedStories = isCreate ? [...stories, story] :
                            () => {
                                const auxStories = [...stories]
                                auxStories.splice(stories.findIndex(s => s.id === story.id), 1, story)
                                return auxStories
                            }
                        setStories(updatedStories)
                    }
                } else {
                    setEditStoryMessage(errorMessage || `could not ${operation} the story`)
                }
            }
        )
    }
    const handleNewStory = (e: React.MouseEvent<HTMLButtonElement>)=>{
        e.preventDefault()
        setSelectedStory(emptyStory)
    }
    const handleDeleteStory = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (selectedStory.id) {
            deleteStory(selectedStory.id).then(({succeed, errorMessage}) => {
                    if (succeed) {
                        setStories((stories)=> {
                            const updatedStories = [...stories]
                            updatedStories.splice(stories.findIndex(s => s.id === selectedStory.id),1)
                            return updatedStories
                        })
                        setSelectedStory(emptyStory)
                        setEditStoryMessage("story deleted successfully")
                    } else {
                        setEditStoryMessage(errorMessage || "could not delete the story")
                    }
                }
            )
        }
    }
    const [editStoryMessage, setEditStoryMessage] = useState("")

    const revalidateHome = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        revalidatePages([RevalidationRouteId.HOME, RevalidationRouteId.EDIT_HOME]).then(({
                                                                                           succeed,
                                                                                           revalidations,
                                                                                           errorMessage
                                                                                       }) => {
                if (succeed) {
                    //there must always be revalidations here
                    if (revalidations) {
                        const message = revalidations.map(r => r.routeId + ":" + r.message).toString()
                        setRevalidationMessage(message)
                    }
                } else {
                    setRevalidationMessage(errorMessage || "there must be always an error message")
                }
            }
        )
    }
    const [revalidationMessage, setRevalidationMessage] = useState("")

    return (
        <Container>
            <PresentationForm onSubmit={handleSavePresentation}>
                <TextInput width={300} value={presentation.name}
                           setValue={(value) => setPresentationProperty("name", value)}/>
                <TextAreaInput height={400} width={1000} value={presentation.introduction}
                               setValue={(value) => setPresentationProperty("introduction", value)}/>
                <Button backgroundColor={"#00008B"} type={"submit"}> SAVE PRESENTATION </Button>
                {editPresentationMessage}
            </PresentationForm>
            <StoryContainer>
                <EditStoryForm onSubmit={handleSavedStory}>
                    <EditStoryDataContainer>
                        <TextInput width={300} value={selectedStory.title}
                                   setValue={(value) => setStoryProperty("title", value)}/>
                        <TextAreaInput height={350} width={700} value={selectedStory.body}
                                       setValue={(value) => setStoryProperty("body", value)}/>
                        {editStoryMessage}
                    </EditStoryDataContainer>
                    <EditStoryButtonsContainer>
                        <Button backgroundColor={"#00008B"} type={"submit"}> {creatingStory ? "CREATE" : "UPDATE"} </Button>
                        {!creatingStory ?
                            <><Button backgroundColor={"#00008B"} onClick={handleNewStory}> NEW </Button>
                                <Button backgroundColor={"#00008B"} onClick={handleDeleteStory}> DELETE </Button></>
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
            </StoryContainer>
            <Button backgroundColor={"#00008B"} onClick={revalidateHome}> REVALIDATE HOME </Button>
            {revalidationMessage}
        </Container>
    )
}

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 50px;
  background-color: #4682B4;
  gap: 20px;
  height: fit-content;
`
const PresentationForm = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color: #B0C4DE;
  gap: 20px;
  padding: 50px;
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