import styled from "@emotion/styled"
import React, {ChangeEvent, FormEvent, useState} from "react"
import {HomeComponentProps, PresentationComponent, StoryComponent} from "../../types/Home"
import path from "path"
import {revalidatePages} from "../api/revalidate/multiple"
import {RevalidationPathId} from "../../types/Revalidation"
import {propsStorageClient} from "../../classes/Props";
import {putPresentation} from "../api/props/home/presentation";
import {deleteStory, putStory} from "../api/props/home/story";

export const EDITH_HOME_PATH = path.normalize(path.relative("/pages", "./"))

export async function getStaticProps() {
    console.log(EDITH_HOME_PATH)
    const homeProps = await propsStorageClient.getHomeProps()

    return {props: {homeProps}}
}

const emptyStory = {id: undefined, title: "", body: ""}
const emptyPresentation = {id: undefined, name: "", introduction: ""}

export default function EditHome(props: HomeComponentProps | null) {
    const [presentation, setPresentation] = useState(props?.presentation || emptyPresentation)
    const handlePresentationChange = (e: ChangeEvent<HTMLInputElement>, presentationKey: keyof PresentationComponent) => {
        setPresentation((presentation) => {
            presentation[presentationKey] = e.target.value
            return presentation
        })
    }
    const handleSavePresentation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const operation = presentation.id ? "UPDATE" : "CREATE"

        putPresentation(presentation).then(({succeed, presentation, errorMessage}) => {
                if (succeed) {
                    setEditPresentationMessage(`presentation ${operation}d`)
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
    const handleStoryChange = (e: ChangeEvent<HTMLInputElement>, storyKey: keyof StoryComponent) => {
        setSelectedStory((story) => {
            story[storyKey] = e.target.value
            return story
        })
    }
    const handleSavedStory = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const isCreate = presentation.id === undefined
        const operation = isCreate ? "CREATE" : "UPDATE"

        putStory(selectedStory).then(({succeed, story, errorMessage}) => {
                if (succeed) {
                    setEditStoryMessage(`story ${operation}d`)
                    if (story) {
                        setSelectedStory(story)
                        const updatedStories = isCreate ? [...stories, story] :
                            stories.splice(stories.findIndex(s => s.id === story?.id), 1, story)
                        setStories(updatedStories)
                    }

                } else {
                    setEditStoryMessage(errorMessage || `could not ${operation} the story`)
                }
            }
        )
    }
    const handleDeleteStory = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (selectedStory.id) {
            deleteStory(selectedStory.id).then(({succeed, errorMessage}) => {
                    if (succeed) {
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

        try {
            const revalidationsResponse = await revalidatePages([RevalidationPathId.HOME, RevalidationPathId.EDIT_HOME])
            if (!revalidationsResponse.succeed) {
                setRevalidationMessage(revalidationsResponse.errorMessage || "there must be always an error message")
            } else {
                const revalidations = revalidationsResponse.revalidations
                //there must always be revalidations here
                if (revalidations) {
                    const message = revalidations.map(r => r.pathId + ":" + r.message).toString()
                    setRevalidationMessage(message)
                }
            }
        } catch (e) {
            setRevalidationMessage("could not revalidate the home")
            console.error(e)
        }
    }
    const [revalidationMessage, setRevalidationMessage] = useState("")

    return (
        <Container>
            <PresentationForm onSubmit={handleSavePresentation}>
                <TextInput type={"text"} onChange={(e) => handlePresentationChange(e, "name")}/>
                <TextInput type={"text"} onChange={(e) => handlePresentationChange(e, "introduction")}/>
                <Button type={"submit"}> SAVE PRESENTATION </Button>
                {editPresentationMessage}
            </PresentationForm>
            <StoryContainer>
                <EditStoryForm onSubmit={handleSavedStory}>
                    <EditStoryDataContainer>
                        <TextInput type={"text"} onChange={(e) => handleStoryChange(e, "title")}/>
                        <TextInput type={"text"} onChange={(e) => handleStoryChange(e, "body")}/>
                        {editStoryMessage}
                    </EditStoryDataContainer>
                    <Button type={"submit"}> {creatingStory ? "CREATE" : "UPDATE"} </Button>
                    {creatingStory ?
                        <Button onClick={handleDeleteStory}> DELETE </Button>
                        : ""
                    }

                </EditStoryForm>
                <StoryTable>
                    {stories.map((s)=> (
                        <StoryRow key={s.id}> <div> {s.title}</div> <div>{s.body}</div></StoryRow>
                    ))}
                </StoryTable>

            </StoryContainer>
            <Button onClick={revalidateHome}> REVALIDATE HOME </Button>
            {revalidationMessage}
        </Container>
    )
}

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 50px;
  background-color: #006400;
  gap: 15px;
  height: fit-content;
`
const PresentationForm = styled.form`
  align-items: left;
  display: flex;
  flex-direction: column;
  background-color: #006400;
  gap: 20px;
`
const TextInput = styled.input`
    `
const StoryContainer = styled.div`
  align-items: left;
  display: flex;
  flex-direction: column;
  background-color: #006400;
  gap: 20px;
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
const StoryTable = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color:;
  gap: 5px;
`
const StoryRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 5px;
`
const Button = styled.button`
 background-color: #000000;
 color: #FFFFFF;
`