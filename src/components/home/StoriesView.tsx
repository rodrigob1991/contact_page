import {NewStory, Story, StoryHTMLElementIds, ViewMode} from "../../types/Home"
import React, {useState} from "react"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"
import styled from "@emotion/styled"
import {PlusButton} from "../Buttons"

type StoryVisibility = {id: string, story: Story | NewStory, isOpen: boolean}

type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type GetNewStory = () => [string, NewStory]
type OnDeleteStory = (id: string) => void
type EditingProps = {
    editing: true
    createNewStory: GetNewStory
    getHtmlElementIds: GetHtmlElementIds
    onDeleteStory : OnDeleteStory
}
type Props<M extends ViewMode> = {
    stories: Story[]
} & (M extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function StoriesView<M extends ViewMode>({editing, stories,createNewStory, getHtmlElementIds, onDeleteStory}: Props<M>) {
    const [storiesVisibility, setStoriesVisibility] = useState(stories.map<StoryVisibility>((s) => {
        return {id: s.id, story: s, isOpen: false}
    }))
    const addNewStory = () => {
        setStoriesVisibility((sv) => {
                const [id, newStory] = (createNewStory as GetNewStory)()
                return [...sv, {id: id, story: newStory, isOpen: true}]
            }
        )
    }
    const openOrCloseStory = (index: number) => {
        const updatedStoriesVisibility = [...storiesVisibility]
        updatedStoriesVisibility[index].isOpen = !updatedStoriesVisibility[index].isOpen
        setStoriesVisibility(updatedStoriesVisibility)
    }
    const getStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story : {title, body}, isOpen} = storyVisibility

        const storyTitle =
            <StoryTitleView>
                <StoryTitle>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>{
                    isOpen ? <BsChevronDoubleUp/>
                        : <BsChevronDoubleDown/>
                }</StoryOpenCloseIcon>
            </StoryTitleView>
        return (
            <StoryView key={id}>{
                isOpen ? <StoryOpenView>
                            {storyTitle}
                            <StoryBody>
                                {body}
                            </StoryBody>
                        </StoryOpenView>
                    : storyTitle
            }</StoryView>
        )
    }
    const getEditableStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story: {title, body}, isOpen} = storyVisibility
        const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(id)

        const storyTitle =
            <StoryTitleView>
                <StoryTitle id={htmlIds.title} contentEditable={editing}>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>{
                    isOpen ? <BsChevronDoubleUp/>
                        : <BsChevronDoubleDown/>
                }</StoryOpenCloseIcon>
            </StoryTitleView>
        return (
            <StoryView key={id}>{
                isOpen ? <StoryOpenView>
                            {storyTitle}
                            <StoryBody id={htmlIds.body} contentEditable={editing}>
                                {body}
                            </StoryBody>
                        </StoryOpenView>
                    : storyTitle
            }</StoryView>
        )
    }
    return (
        <Container>
            <TitleContainer>
                <Title>STORIES</Title> {editing &&
            <PlusButton color={"#FFFFFF"} size={26} onClick={(e) => addNewStory()}/>}
            </TitleContainer>
            <ul>
                {storiesVisibility
                    .map((sv, index) =>
                        editing ? getEditableStoryView(sv, index) : getStoryView(sv, index)
                    )
                }
            </ul>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 90px;
  gap: 15px;
  background-color: #00008B;
  padding-top: 15px;
  padding-bottom: 15px;
    `
const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 25px;
`
const Title = styled.text`
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
const StoryView = styled.li`
  list-style-type: none;
  padding-bottom: 15px;
  margin-top: 15px;
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