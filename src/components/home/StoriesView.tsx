import {NewStory, Story, StoryHTMLElementIds, ViewMode} from "../../types/Home"
import React, {useEffect, useState} from "react"
import styled from "@emotion/styled"
import {DeleteOrRecoverStoryButton, OpenOrCloseStoryButton, PlusButton} from "../Buttons"
import {Pallet} from "../Pallet"
import {OptionSelector} from "../FormComponents"
import {StoryState} from "@prisma/client"

type StoryVisibility = {id: string, story: Story | NewStory, isOpen: boolean, toDelete: boolean}

type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type GetNewStory = () => [string, NewStory]
type DeleteStory = (id: string) => void
type RecoverStory = (id: string) => void
type AddHighlightText = (id: string) => void
type EditingProps = {
    editing: true
    createNewStory: GetNewStory
    getHtmlElementIds: GetHtmlElementIds
    deleteStory : DeleteStory
    recoverStory : RecoverStory
    addHighlightText : AddHighlightText
}
type Props<M extends ViewMode> = {
    stories: Story[]
} & (M extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function StoriesView<M extends ViewMode>({
                                                            editing,
                                                            stories,
                                                            createNewStory,
                                                            getHtmlElementIds,
                                                            deleteStory,
                                                            recoverStory,
                                                            addHighlightText
                                                        }: Props<M>) {
    const [storiesVisibility, setStoriesVisibility] = useState<StoryVisibility[]>(stories.map((s) => {
        return {id: s.id, story: s, toDelete: false, isOpen: false}
    }))
    useEffect(() => {
            setStoriesVisibility((storiesVisibility) => {
                const updatedStoriesVisibility = []
                for (const sv of storiesVisibility) {
                    if (!sv.toDelete) {
                        const prevStory = sv.story
                        const predicate = (s: Story) => "id" in prevStory ? prevStory.id === s.id : prevStory.title === s.title
                        const story = stories.find(predicate)

                        // always should found the story
                        if (story) {
                            updatedStoriesVisibility.push({...(({story,id,...sv}) => sv)(sv), story: story, id: story.id})
                        }
                    }
                }
                return updatedStoriesVisibility
            })
        },
        [stories])

    const handleAddNewStory = (e: React.MouseEvent) => {
        const [id, newStory] = (createNewStory as GetNewStory)()
        setStoriesVisibility((sv) => {
                return [...sv, {id: id, story: newStory, isOpen: true, toDelete: false}]
            }
        )
    }
    const handleDeleteStory = (e: React.MouseEvent, id: string, index: number, isNew: boolean) => {
        (deleteStory as DeleteStory)(id)
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
    const handleRecoverStory = (e: React.MouseEvent, id: string, index: number) => {
        (recoverStory as RecoverStory)(id)
        setStoriesVisibility((sv) => {
            const updatedSv = [...sv]
            updatedSv[index].toDelete = false
            return updatedSv
        })
    }
    const openOrCloseStory = (index: number) => {
        const updatedStoriesVisibility = [...storiesVisibility]
        updatedStoriesVisibility[index].isOpen = !updatedStoriesVisibility[index].isOpen
        setStoriesVisibility(updatedStoriesVisibility)
    }
    const [storyIdOnFocus, setStoryIdOnFocus] = useState<string | undefined>(undefined)

    const getStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story : {title, body}, isOpen} = storyVisibility

        const storyTitle =
            <StoryTitleContainer>
                <StoryTitle>{title}</StoryTitle>
                <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen} onClick={(e => openOrCloseStory(index))}/>
            </StoryTitleContainer>
        return (
            <StoryContainer key={id}>{
                isOpen ? <StoryOpenContainer>
                            {storyTitle}
                            <StoryBody dangerouslySetInnerHTML={{__html: body }}/>
                        </StoryOpenContainer>
                    : storyTitle
            }</StoryContainer>
        )
    }
    const getEditableStoryView = (storyVisibility: StoryVisibility, index: number) => {
        const {id, story, isOpen, toDelete} = storyVisibility
        const {title,body} = story
        const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(id)

        const contentEditable = editing && !toDelete

        const storyTitleView =
            <StoryTitleContainer>
                <StoryTitle id={htmlIds.title} toDelete={toDelete} contentEditable={contentEditable}>{title}</StoryTitle>
                <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen} onClick={(e => openOrCloseStory(index))}/>
                <DeleteOrRecoverStoryButton color={"#778899"} isDelete={toDelete} size={20}
                                            onClick={(e)=> toDelete
                                                ? handleRecoverStory(e,id,index)
                                                : handleDeleteStory(e,id,index, !("id" in story))}/>
                <Pallet show={storyIdOnFocus === id}/>
            </StoryTitleContainer>

        return (
            <StoryContainer key={id}>
                <OptionSelector id={htmlIds.state} color={"#778899"} fontSize={15} options={Object.values(StoryState)} initSelectedOption={story.state}/>
                {isOpen ? <StoryOpenContainer>
                            {storyTitleView}
                            <StoryBody id={htmlIds.body} contentEditable={contentEditable}
                                       dangerouslySetInnerHTML={{__html: body}}
                                       onFocus={e => setStoryIdOnFocus(id)}
                                       onBlur={e => setStoryIdOnFocus(undefined)}/>
                        </StoryOpenContainer>
                    : storyTitleView}
            </StoryContainer>
        )
    }
    return (
        <Container>
            <TitleContainer>
                <Title>STORIES</Title> {editing &&
            <PlusButton id={"plus-button"} color={"#778899"} size={26} onClick={handleAddNewStory}/>}
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
  padding-top: 15px;
  padding-bottom: 15px;
  background-color: #fff;
  background-image:
  linear-gradient(90deg, transparent 79px, #abced4 79px, #abced4 81px, transparent 81px),
  linear-gradient(#eee .1em, transparent .1em);
  background-size: 100% 1.2em;
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
  border-radius: 5px;
  background-color: #778899;
  width: fit-content;
  padding: 5px;
  `
const StoryContainer = styled.li`
  list-style-type: none;
  padding-bottom: 15px;
  margin-top: 15px;
`
const StoryBody = styled.div`
  color: #696969;
  background-color: #FFFFFF;
  font-size: 28px;
  font-family: "Lucida Console", "Courier New", monospace;
  border-color: #778899;
  border-width: thin;
  border-style: solid;
  border-radius: 5px;
  padding: 6px;
  block-size: fit-content;
`
const StoryTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  gap: 15px;
  color: #FFFFFF;
  width: fit-content;
`
const StoryTitle = styled.span<{ toDelete?: boolean }>`
  font-size: 33px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  color: #778899;
  text-shadow: 2px 2px 1px #000000;
  ${props => 
    props.toDelete ? 
        "text-decoration: line-through;"
        + "text-decoration-color: red;"
        + "text-decoration-style: wavy;"
        : ""
} 
`
const StoryOpenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`