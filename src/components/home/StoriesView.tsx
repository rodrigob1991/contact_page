import {NewStory, Story} from "../../types/Home"
import React, {useState} from "react"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"
import styled from "@emotion/styled"

type Mode =  "editing" | "watching"

type StoryVisibility<S extends NewStory | Story> = { story: S, isOpen: boolean }
type NewStories<M extends Mode> = M extends "editing" ? NewStory[] : undefined
type GetHtmlElementIds<M extends Mode> = M extends "editing" ? (IdOrIndex: string | number) => string : undefined

type Props<M extends Mode> = {
    editing: M extends "editing" ? true : false
    stories: Story[]
    newStories: NewStories<M>
    getHtmlElementIds: GetHtmlElementIds<M>
}

export default function StoriesView<M extends Mode>({editing, stories, newStories, getHtmlElementIds}: Props<M>) {
    const [storiesVisibility, setStoriesVisibility] = useState<StoryVisibility<Story>[]>(stories.map((story) => {
        return {story: story, isOpen: false}
    }))
    const [newStoriesVisibility, setNewStoriesVisibility] = useState<StoryVisibility<NewStory>[]>(newStories ? newStories.map((story) => {
        return {story: story, isOpen: false}
    }) : [])

    const openOrCloseStory = (index: number) => {
        const story = {...storiesWithState[index]}
        story.isOpen = !story.isOpen
        setStoriesWithState((stories) => {
            const updatedStories = [...stories]
            updatedStories.splice(index, 1, story)
            return updatedStories
        })
    }

    const getStoryView = (storyVisibility: StoryVisibility<Story>, index: number) => {
        const {story : {title, body}, isOpen} = storyVisibility

        const storyTitle =
            <StoryTitleView>
                <StoryTitle>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>
                    {isOpen ? <BsChevronDoubleUp/>
                        :
                        <BsChevronDoubleDown/>}
                </StoryOpenCloseIcon>
            </StoryTitleView>
        return (
            <StoryView>{
                isOpen ?
                    <StoryOpenView>
                        {storyTitle}
                        <StoryBody>
                            {body}
                        </StoryBody>
                    </StoryOpenView>
                    :
                    storyTitle
            }
            </StoryView>
        )
    }
    const getEditableStoryView = (storyVisibility: StoryVisibility<Story | NewStory>, index: number, getHtmlElementIds: GetHtmlElementIds<"editing">) => {
        const {story: {title, body}, isOpen} = storyVisibility
        const htmlIds = getHtmlElementIds()

        const storyTitle =
            <StoryTitleView>
                <StoryTitle id={} contentEditable={editing}>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>
                    {isOpen ? <BsChevronDoubleUp/>
                        :
                        <BsChevronDoubleDown/>}
                </StoryOpenCloseIcon>
            </StoryTitleView>
        return (
            <StoryView>{
                isOpen ?
                    <StoryOpenView>
                        {storyTitle}
                        <StoryBody id={} contentEditable={editing}>
                            {body}
                        </StoryBody>
                    </StoryOpenView>
                    :
                    storyTitle
            }
            </StoryView>
        )
    }
    return (
        <Container>
            <StoryContainerTitle>STORIES</StoryContainerTitle>
            {storiesVisibility
                .map(({story, isOpen}, index) => getStoryView(story, index, isOpen))
                .concat(newStoriesVisibility
                    .map(({story, isOpen}, index) => getStoryView(story, index, isOpen)))
            }
        </Container>
    )
}

const StoryContainerTitle = styled.div`
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
const Container = styled.div`
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
const StoryBody = styled.span`
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
  width: fit-content;
`
const StoryOpenCloseIcon = styled.div`
  cursor: pointer;
`

const StoryTitle = styled.span`
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