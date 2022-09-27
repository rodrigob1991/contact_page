import {NewStory, Story, StoryHTMLElementIds, ViewMode} from "../../types/Home"
import React, {useEffect, useRef, useState} from "react"
import styled from "@emotion/styled"
import {DeleteOrRecoverButton, OpenOrCloseStoryButton, PlusButton} from "../Buttons"
import {Pallet} from "../Pallet"
import {OptionSelector} from "../FormComponents"
import {StoryState} from "@prisma/client"
import Image from 'next/image'

type StoryViewStates = {idHtml: string, story: Story | NewStory, isOpen: boolean, toDelete: boolean}

type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type GetNewStory = () => [string, NewStory]
type DeleteStory = (id: string) => void
type RecoverStory = (id: string) => void
type EditingProps = {
    editing: true
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

    const handleAddNewStory = (e: React.MouseEvent) => {
        const [idHtml, newStory] = (createNewStory as GetNewStory)()
        setStoriesViewStates((svs) => {
                return [...svs, {idHtml: idHtml, story: newStory, isOpen: true, toDelete: false}]
            }
        )
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
    const openOrCloseStory = (index: number) => {
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].isOpen = !updatedStoriesViewStates[index].isOpen
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

    const convertBodyFromHtmlToJsx = (body: string) => {
        let jsx = <></>
        const html = new DOMParser().parseFromString(body, "text/html").body.children
        for (const div of html) {
            if(div instanceof HTMLDivElement) {
                let jsxDivChildren = <></>
                for (const divChild of div.childNodes) {
                    let jsxDivChild
                    if (divChild instanceof Text) {
                        jsxDivChild = divChild.nodeValue
                    } else if (divChild instanceof HTMLSpanElement) {
                        jsxDivChild = <span className={divChild.className}>{divChild.firstChild?.nodeValue}</span>
                    } else if (divChild instanceof HTMLAnchorElement) {
                        jsxDivChild = <a className={divChild.className} href={divChild.href}>{divChild.firstChild?.nodeValue}</a>
                    } else if (divChild instanceof HTMLImageElement) {
                        jsxDivChild = <div style={{paddingLeft: div.style.paddingLeft}}><Image src={divChild.src} layout={"intrinsic"}
                                                                              height={divChild.height}
                                                                              width={divChild.width}/></div>
                    } else if (divChild instanceof HTMLBRElement) {
                        // for now ignore this case
                    } else {
                        throw new Error("div child of type " + divChild.nodeType + " must have enter some if")
                    }
                    jsxDivChildren = <>{jsxDivChildren} {jsxDivChild}</>
                }
                jsx = <>{jsx}<div>{jsxDivChildren}</div></>
            } else {
                throw new Error("Only divs must appears here")
            }
        }
        return jsx
    }

    const getStoryView = (storyVisibility: StoryViewStates, index: number) => {
        const {story : {title, body}, isOpen} = storyVisibility

        const storyTitle = <StoryTitleContainer>
                                <StoryTitle>{title}</StoryTitle>
                                <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen} onClick={(e => openOrCloseStory(index))}/>
                            </StoryTitleContainer>
        return (
            <StoryContainer key={title}>
                {isOpen ? <StoryOpenContainer>
                            {storyTitle}
                            <StoryBody>{convertBodyFromHtmlToJsx(body)}</StoryBody>
                          </StoryOpenContainer>
                        : storyTitle}
            </StoryContainer>
        )
    }
    const getEditableStoryView = (storyVisibility: StoryViewStates, index: number) => {
        const {idHtml, story, isOpen, toDelete} = storyVisibility
        const {title,body} = story
        const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(idHtml)

        const contentEditable = editing && !toDelete
        const handleOnFocusBody = (e: React.FocusEvent) => {
            setEditingStoryIdHtml(idHtml)
        }
        const handleOnBlurBody = (e: React.FocusEvent) => {
            if (!refToIsAsking.current) {
                setEditingStoryIdHtml("")
            }
        }

        const storyTitleView =
            <StoryTitleContainer>
                <StoryTitle id={htmlIds.title} toDelete={toDelete} contentEditable={contentEditable}>{title}</StoryTitle>
                <OpenOrCloseStoryButton size={25} color={"#778899"} isOpen={isOpen} onClick={(e => openOrCloseStory(index))}/>
                <DeleteOrRecoverButton color={"#778899"} initShowDelete={!toDelete} size={20}
                                       handleDelete={() => {handleDeleteStory(idHtml, index, !("id" in story))}}
                                       handleRecover={() => {handleRecoverStory(idHtml, index)}}/>
                <Pallet show={isEditingStory(idHtml)} isAsking={isAsking} fontSize={bodyStoryFontSize}/>
            </StoryTitleContainer>

        return (
            <StoryContainer key={idHtml}>
                <OptionSelector id={htmlIds.state} color={"#778899"} fontSize={15} options={Object.values(StoryState)} initSelectedOption={story.state}/>
                {isOpen ? <StoryOpenContainer>
                            {storyTitleView}
                            <StoryBody id={htmlIds.body} contentEditable={contentEditable}
                                       dangerouslySetInnerHTML={{__html: body}}
                                       onFocus={handleOnFocusBody}
                                       onBlur={handleOnBlurBody}
                                       />
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
                {storiesViewStates
                    .map((s, index) =>
                        editing ? getEditableStoryView(s, index) : getStoryView(s, index)
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
const bodyStoryFontSize = 28
const StoryBody = styled.div`
  color: #696969;
  background-color: #FFFFFF;
  font-size: ${bodyStoryFontSize}px;
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