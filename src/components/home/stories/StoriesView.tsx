import {NewStory, Story, StoryHTMLElementIds, ViewMode} from "../../../types/Home"
import React, {useEffect, useRef, useState} from "react"
import styled from "@emotion/styled"
import {DeleteOrRecoverButton, OpenOrCloseStoryButton, PlusButton} from "../../Buttons"
import {Pallet} from "../../Pallet"
import {OptionSelector} from "../../FormComponents"
import {StoryState} from "@prisma/client"
import {Observe} from "../../../pages/user/edit_home"
import {getStoryBodyJsx} from "../../../utils/Parsers"
import {css} from "@emotion/react";

export type StoryViewStates = {idHtml: string, story: Story | NewStory, isOpen: boolean, toDelete: boolean}

type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type GetNewStory = () => [string, NewStory]
type DeleteStory = (id: string) => void
type RecoverStory = (id: string) => void
type EditingProps = {
    editing: true
    observe: Observe
    createNewStory: GetNewStory
    getHtmlElementIds: GetHtmlElementIds
    deleteStory : DeleteStory
    recoverStory : RecoverStory
}
type Props<M extends ViewMode> = {
    stories: Story[]
} & (M extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function StoriesView<M extends ViewMode>({
                                                            editing,
                                                            observe,
                                                            stories,
                                                            createNewStory,
                                                            getHtmlElementIds,
                                                            deleteStory,
                                                            recoverStory

                                                        }: Props<M>) {
    // idHtml is use to identify the html element. Can be story id or index of new stories array
    const [storiesViewStates, setStoriesViewStates] = useState<StoryViewStates[]>(stories.map((s) => {
        return {idHtml: s.id, story: s, toDelete: false, isOpen: false}
    }))

    const openOrCloseStory = (index: number) => {
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].isOpen = !updatedStoriesViewStates[index].isOpen
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const getStoriesView = () =>
        storiesViewStates.map(({story: {title, body}, isOpen}, index) => {
            const JsxBody = getStoryBodyJsx(body)
            return (
                <StoryContainer key={title}>
                    <StoryTitleContainer onClick={(e => openOrCloseStory(index))}>
                        <StoryTitle>{title}</StoryTitle>
                        <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen}/>
                    </StoryTitleContainer>
                    {isOpen && <StoryBody>{JsxBody}</StoryBody>}
                </StoryContainer>
            )
        })
    // this effect is for maintain the previous states when saving stories
    useEffect(() => {
            setStoriesViewStates((storiesViewStates) => {
                const updatedStoriesViewStates = []
                for (const svs of storiesViewStates) {
                    if (!svs.toDelete) {
                        const prevStory = svs.story
                        const predicate = (s: Story) => "id" in prevStory ? prevStory.id === s.id : prevStory.title === s.title
                        const story = stories.find(predicate)
                        if(!story){
                            throw new Error("always must the story exist")
                        }
                        updatedStoriesViewStates.push({...(({story,idHtml,...rest}) => rest)(svs), story: story, idHtml: story.id})
                    }
                }
                return updatedStoriesViewStates
            })
        },
        [stories])

    const refToLastStory = useRef<HTMLDivElement>()
    const handleAddNewStory = (e: React.MouseEvent) => {
        const [idHtml, newStory] = (createNewStory as GetNewStory)()
        setStoriesViewStates((svs) => {
                return [...svs, {idHtml: idHtml, story: newStory, isOpen: true, toDelete: false}]
            }
        )
        setTimeout(() => {
            refToLastStory.current?.focus()
        }, 500)
    }
    const handleDeleteStory = (idHtml: string, index: number, isNew: boolean) => {
        (deleteStory as DeleteStory)(idHtml)
        const updatedStoriesViewStates = [...storiesViewStates]
        if (isNew) {
            updatedStoriesViewStates.splice(index, 1)
        } else {
            updatedStoriesViewStates[index].toDelete = true
        }
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const handleRecoverStory = (idHtml: string, index: number) => {
        (recoverStory as RecoverStory)(idHtml)
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].toDelete = false
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const [editingStoryIdHtml, setEditingStoryIdHtml] = useState("")
    const isEditingStory = (idHtml: string) => {
        return editingStoryIdHtml === idHtml
    }
    const refToIsAsking = useRef(false)
    const isAsking = (asking: boolean) => {
        refToIsAsking.current = asking
    }
    const getEditableStoriesView = () =>
        storiesViewStates.map(({idHtml, story, isOpen, toDelete}, index) => {
            const {title,body, state} = story
            const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(idHtml)

            const handleOnFocusBody = (e: React.FocusEvent) => {
                setEditingStoryIdHtml(idHtml)
            }
            const handleOnBlurBody = (e: React.FocusEvent) => {
                if (!refToIsAsking.current) {
                    setEditingStoryIdHtml("")
                }
            }
            return (
                <StoryContainer key={idHtml}>
                    <OptionSelector id={htmlIds.state} processRefToValueHtmlElement={(r)=> (observe as Observe)(r, {mutation: "default"})}
                                    color={"#778899"} fontSize={"1.5rem"} options={Object.values(StoryState)} initSelectedOption={state}/>
                    <StoryTitleContainer>
                        <StoryTitle id={htmlIds.title} ref={r => {if(r) (observe as Observe)(r, {mutation: "default"})}} toDelete={toDelete} contentEditable={!toDelete}>
                            {title}
                        </StoryTitle>
                        <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen} onClick={(e => openOrCloseStory(index))}/>
                        <DeleteOrRecoverButton color={"#778899"} initShowDelete={!toDelete} size={20}
                                               handleDelete={() => {handleDeleteStory(idHtml, index, !("id" in story))}}
                                               handleRecover={() => {handleRecoverStory(idHtml, index)}}/>
                        <Pallet rootElementId={htmlIds.body} show={isEditingStory(idHtml)} isAsking={isAsking}/>
                    </StoryTitleContainer>
                    {isOpen && <StoryBody id={htmlIds.body} contentEditable={!toDelete}
                                          ref={r => {if(r) {refToLastStory.current = r; (observe as Observe)(r, {mutation: {characterData: true, subtree: true, childList: true, attributeFilter: ["href", "src"]}})}}}
                                          dangerouslySetInnerHTML={{__html: body}}
                                          onFocus={handleOnFocusBody}
                                          onBlur={handleOnBlurBody}
                    />}
                </StoryContainer>
            )
        })

    return (
        <Container>
            <TitleContainer>
                <Title>STORIES</Title> {editing &&
            <PlusButton id={"plus-button"} color={"#FFFFFF"} size={26} onClick={handleAddNewStory}/>}
            </TitleContainer>
            <StoriesContainer>
                {editing ? getEditableStoriesView()
                         : getStoriesView()
                }
            </StoriesContainer>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 15px;
  background-color: #778899;
  border-style: solid;
  border-color: #FFFFFF;
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
  font-size: 2rem;
  `
const StoriesContainer = styled.ul`
  padding: 0;
  margin: 0;
  width: 100%;
  overflow: auto;
  max-height: 50vh;
  border-style: solid;
  border-color: #778899;
  padding: 5px;
  background-color: #fff;
  background-image:
  linear-gradient(#eee .1em, transparent .1em);
  background-size: 100% 2.5em;
`
const StoryContainer = styled.li`
  list-style-type: none;
  padding-bottom: 15px;
  border-color: #778899;
  border-width: medium;
  border-bottom-style: solid;
  margin-top: 15px;
  :last-of-type {
        border-bottom-style: none;
    }
`

const StoryBody = styled.div`
  color: #696969;
  font-size: 2.5rem;
  font-family: "Lucida Console", "Courier New", monospace;
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
  cursor: pointer;
`
const StoryTitle = styled.span<{ toDelete?: boolean }>`
  font-size: 2.5rem;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  color: #778899;
  text-shadow: 2px 2px 1px #000000;
  padding-bottom: 5px;
  ${props => 
    props.toDelete ? 
        "text-decoration: line-through;"
        + "text-decoration-color: red;"
        + "text-decoration-style: wavy;"
        : ""
} 
`