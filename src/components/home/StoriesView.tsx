import {NewStory, Story, StoryHTMLElementIds, ViewMode} from "../../types/Home"
import React, {useState} from "react"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"
import styled from "@emotion/styled"
import {DeleteButton, PlusButton} from "../Buttons"
import {css} from "@emotion/react";

type StoryVisibility = {id: string, story: Story | NewStory, isOpen: boolean, toDelete: boolean}

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
        return {id: s.id, story: s, isOpen: false, toDelete: false}
    }))
    const handleAddNewStory = (e : React.MouseEvent) => {
        setStoriesVisibility((sv) => {
                const [id, newStory] = (createNewStory as GetNewStory)()
                return [...sv, {id: id, story: newStory, isOpen: true, toDelete: false}]
            }
        )
    }
    const handleDeleteStory = (e: React.MouseEvent, id: string, index: number, isNew: boolean) => {
        (onDeleteStory as OnDeleteStory)(id)
        setStoriesVisibility((sv) => {
            const updatedSv = [...sv]
            if (isNew) {
                updatedSv.splice(index, 1)
            } else {
                updatedSv[index].toDelete = true
            }
            return updatedSv
        })
    }
    const openOrCloseStory = (index: number) => {
        const updatedStoriesVisibility = [...storiesVisibility]
        updatedStoriesVisibility[index].isOpen = !updatedStoriesVisibility[index].isOpen
        setStoriesVisibility(updatedStoriesVisibility)
    }
    const getStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story : {title, body}, isOpen} = storyVisibility

        const storyTitle =
            <StoryTitleContainer>
                <StoryTitle>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>{
                    isOpen ? <BsChevronDoubleUp/>
                        : <BsChevronDoubleDown/>
                }</StoryOpenCloseIcon>
            </StoryTitleContainer>
        return (
            <StoryContainer key={id}>{
                isOpen ? <StoryOpenContainer>
                            {storyTitle}
                            <StoryBody>
                                {body}
                            </StoryBody>
                        </StoryOpenContainer>
                    : storyTitle
            }</StoryContainer>
        )
    }
    const getEditableStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story, isOpen, toDelete} = storyVisibility
        const {title,body} = story
        const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(id)

        const storyTitleView =
            <StoryTitleContainer>
                <StoryTitle id={htmlIds.title} toDelete={toDelete} contentEditable={editing}>{title}</StoryTitle>
                <StoryOpenCloseIcon onClick={(e => openOrCloseStory(index))}>{
                    isOpen ? <BsChevronDoubleUp/>
                        : <BsChevronDoubleDown/>
                }</StoryOpenCloseIcon>
                <DeleteButton size={20} onClick={(e)=> handleDeleteStory(e,id,index, !("id" in story))}/>
            </StoryTitleContainer>
        return (
            <StoryContainer key={id}>{
                isOpen ? <StoryOpenContainer>
                            {storyTitleView}
                            <StoryBody id={htmlIds.body} contentEditable={editing}>
                                {body}
                            </StoryBody>
                        </StoryOpenContainer>
                    : storyTitleView
            }</StoryContainer>
        )
    }
    return (
        <Container>
            <TitleContainer>
                <Title>STORIES</Title> {editing &&
            <PlusButton color={"#FFFFFF"} size={26} onClick={handleAddNewStory}/>}
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
const StoryContainer = styled.li`
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
const StoryTitleContainer = styled.div`
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
const StoryTitle = styled.span<{toDelete?: boolean}>`
  font-size: 25px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  text-shadow: 2px 2px 5px #000000;
  ${props => props.toDelete 
    ? css`color: #A52A2A;` 
    : ""} 
`
const StoryOpenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`