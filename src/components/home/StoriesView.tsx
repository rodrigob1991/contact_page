import {NewStory, Story, StoryHTMLElementIds} from "../../types/Home"
import React, {useState} from "react"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"
import styled from "@emotion/styled"

type Mode =  "editing" | "reading"
type GetHtmlElementIds = (id: string) => StoryHTMLElementIds

type EditingProps = {
    editing: true
    newStories: NewStory[]
    getHtmlElementIds: GetHtmlElementIds

}
type Props<M extends Mode> = {
    stories: Story[]
} & (M extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

type StoryVisibility = { story: Story, isOpen: boolean}

export default function StoriesView<M extends Mode>({editing, stories, newStories, getHtmlElementIds}: Props<M>) {
    const [storiesVisibility, setStoriesVisibility] = useState(stories.map<StoryVisibility>((story) => {
        return {story: story, isOpen: false}
    }).concat(newStories ? newStories.map((story, index) => {
        return {story: {id: "-" + index, ...story}, isOpen: false}
    }) : []))

    const openOrCloseStory = (index: number) => {
        const updatedStoriesVisibility = [...storiesVisibility]
        updatedStoriesVisibility[index].isOpen = !updatedStoriesVisibility[index].isOpen
        setStoriesVisibility(updatedStoriesVisibility)
    }

    const getStoryView = (storyVisibility: StoryVisibility, index: number) => {
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
    const getEditableStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {story: {id,title, body}, isOpen} = storyVisibility
        const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(id)

        const storyTitle =
            <StoryTitleView>
                <StoryTitle id={htmlIds.title} contentEditable={editing}>{title}</StoryTitle>
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
                        <StoryBody id={htmlIds.body} contentEditable={editing}>
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
                .map((sv, index) =>
                    editing ? getEditableStoryView(sv, index) : getStoryView(sv, index)
                )
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