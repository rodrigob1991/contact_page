import {Presentation, PresentationHTMLElementIds, Story, StoryComponent} from "../types/Home"
import styled from "@emotion/styled"
import React, {useState} from "react"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"

type PresentationProps = {
    editing: boolean
    htmlElementIds: PresentationHTMLElementIds
    presentation?: Presentation
}

export const PresentationView = ({editing, presentation, htmlElementIds: {nameHtmlElementId,introductionHtmlElementId}}: PresentationProps) => {
    const [saved, setSaved] = useState(presentation === undefined)

    const getPresentationDate = () => {
        const name = (document.getElementById(nameHtmlElementId) as HTMLElement).innerText
        const introduction = (document.getElementById(introductionHtmlElementId) as HTMLElement).innerText
        console.log(`name: ${name}. introduction: ${introduction}`)

        return {name: name, introduction: introduction}
    }

    const handleSavePresentation = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const operation = saved ? "UPDATE" : "CREATE"

        getPresentationDate()

       /* putPresentation(getPresentationDate()).then(({succeed, errorMessage}) => {
            let message
            if (succeed) {
                message = `presentation ${operation}D`
                setSaved(true)
            } else {
                message = errorMessage || `could not ${operation} the presentation`
            }

            setSaveResultMessage(message)
        })*/
    }

        const [saveResultMessage, setSaveResultMessage] = useState("")


        return (
            <PresentationContainer>
                <PresentationNameImageContainer>
                    {/*   <Image src="/yo.jpeg" width="100" height="100"/>*/}
                    <PresentationName id={nameHtmlElementId} contentEditable={editing}>
                        {presentation?.name || ""}
                    </PresentationName>
                </PresentationNameImageContainer>
                <PresentationIntroduction id={introductionHtmlElementId} contentEditable={editing}>
                    {presentation?.introduction || ""}
                </PresentationIntroduction>
               {/* {editing ?
                    <>
                        <Button onClick={handleSavePresentation}> SAVE </Button>
                        {saveResultMessage}
                    </>
                    : ""}*/}
            </PresentationContainer>
        )
    }

const PresentationName = styled.div`
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.div`
  font-weight: bold;
  font-size: 18px;
  background-color: #778899;
  padding: 7px;
  border-radius: 15px;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationNameImageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 20px;
  background-image: linear-gradient(#00008B,#0000FF);
  align-items: center;
  box-shadow: 5px 10px #888888;
    `
export const HomeContainer = styled.div`
  display: flex;
  flex-flow: column;
  height: 100vh;
    `

type StoriesProps = {
    editing: boolean
    stories: Story[]
}

export const Stories = ({editing, stories}: StoriesProps) => {
    const [storiesWithState, setStoriesWithState] = useState(stories.map((story) => {
        return {story: story, isOpen: false}
    }))

    const openOrCloseStory = (index: number) => {
        const story = {...storiesWithState[index]}
        story.isOpen = !story.isOpen
        setStoriesWithState((stories) => {
            const updatedStories = [...stories]
            updatedStories.splice(index, 1, story)
            return updatedStories
        })
    }

    const getStoryView = (story: StoryComponent, index: number, isOpen: boolean) => {
        const storyTitle =
            <StoryTitleView onClick={(e => openOrCloseStory(index))}>
                <StoryTitle>{story.title}</StoryTitle>
                {isOpen ? <BsChevronDoubleUp/> : <BsChevronDoubleDown/>}
            </StoryTitleView>
        return (
            <StoryView>{
                isOpen ?
                    <StoryOpenView>
                        {storyTitle}
                        <StoryBody>
                            {story.body}
                        </StoryBody>
                    </StoryOpenView>
                    :
                    storyTitle
            }
            </StoryView>
        )
    }
}

const StoryContainerTitle = styled.text`
  color: #FFFFFF;
  text-decoration-style: solid;
  text-shadow: 2px 2px 5px #000000;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  border-radius: 15px;
  background-color: #778899;
  width: fit-content;
  padding: 5px;
  `
const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 90px;
  gap: 5px;
  background-color: #00008B;
  padding-top: 15px;
  padding-bottom: 15px;
    `
const StoryView = styled.div`
  padding: 15px;
`
const StoryBody = styled.text`
  color: #FFD700;
  font-size: 22px;
  font-weight: bold;
  font-family: "Lucida Console", "Courier New", monospace;
  border-style: solid;
  border-color: #778899;
  padding: 10px;
  border-radius: 5px;
`
const StoryTitleView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  gap: 15px;
  color: #FFFFFF;
  font-size: 25px;
  cursor: pointer;
  width: fit-content;
`
const StoryTitle = styled.text`
  font-size: 25px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  text-shadow: 2px 2px 5px #000000;
`
const StoryOpenView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`