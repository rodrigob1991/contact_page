import {NewStory, Story, StoryHTMLElementIds, StoryWithJSXBody, ViewMode} from "../../../types/home"
import React, {useEffect, useRef, useState} from "react"
import styled from "@emotion/styled"
import {DeleteOrRecoverButton, OpenOrCloseStoryButton, PlusButton} from "../../Buttons"
import {Pallet} from "../../Pallet"
import {OptionSelector} from "../../FormComponents"
import {StoryState} from "@prisma/client"
import {Observe} from "../../../pages/user/edit_home"
import {mainColor, secondColor} from "../../../colors"

const storiesAnchorsContainerWidth = 150

export type StoryViewStates = {idHtml: string, story: Story | StoryWithJSXBody | NewStory, isOpen: boolean, toDelete: boolean}

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
    stories: Story[] | StoryWithJSXBody[]
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
        return {idHtml: s.id, story: s, toDelete: false, isOpen: true}
    }))

    const openOrCloseStory = (index: number) => {
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].isOpen = !updatedStoriesViewStates[index].isOpen
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const getOpenOrCloseStoryButton = (isOpen: boolean, onClick?: (e: React.MouseEvent) => void) => <OpenOrCloseStoryButton size={25} color={secondColor} isOpen={isOpen} onClick={onClick}/>

    const [showStoriesAnchors, setShowStoriesAnchors] = useState(true)
    const [transparentStoriesAnchors, setTransparentStoriesAnchors] = useState(true)

    const handleOnClickStoriesAnchors = (e: React.MouseEvent) => {
      e.stopPropagation()
      setShowStoriesAnchors((showStoriesAnchors) => {
        let nextShowStoriesAnchors
        let nextTransparentStoriesAnchors
        if(showStoriesAnchors){
            nextShowStoriesAnchors = false
            nextTransparentStoriesAnchors = true
        }else{
            nextShowStoriesAnchors = true
            nextTransparentStoriesAnchors = false
        }
        setTransparentStoriesAnchors(nextTransparentStoriesAnchors)
        
        return nextShowStoriesAnchors
    })
    }
    const handleOnMouseLeaveStoriesAnchors = (e: React.MouseEvent) => {
      setTransparentStoriesAnchors(true)
    }
    const handleOnMouseOverStoriesAnchors = (e: React.MouseEvent) => {
        setTransparentStoriesAnchors(!showStoriesAnchors)
      }
    const handleOnClickStoryAnchor = (e: React.MouseEvent) => {
        e.stopPropagation()
    }
    const storiesAnchorsRef = useRef<HTMLDivElement>(null)
    useEffect(()=> {
        document.addEventListener("touchstart", (e) => {
         const storiesAnchors = storiesAnchorsRef.current as HTMLDivElement
         if(!(storiesAnchors.contains(e.target as Node))){
            setTransparentStoriesAnchors(true)
         }
        })
    },[])

    const getStoriesView = () =>
        storiesViewStates.map(({story: {title, body}, isOpen}, index) => {
            return (
                <StoryContainer id={title} key={title}>
                    <StoryTitle>{title}</StoryTitle>
                    {/*{getOpenOrCloseStoryButton(isOpen)}*/}
                    {isOpen && <StoryBody>{body}</StoryBody>}
                </StoryContainer>
            )
        })
    // this effect is for maintain the previous states when saving stories
    useEffect(() => {
            if (editing) {
                setStoriesViewStates((storiesViewStates) => {
                    const updatedStoriesViewStates = []
                    for (const svs of storiesViewStates) {
                        if (!svs.toDelete) {
                            const prevStory = svs.story
                            const predicate = (s: Story) => "id" in prevStory ? prevStory.id === s.id : prevStory.title === s.title
                            const story = (stories as Story[]).find(predicate)
                            if (!story) {
                                throw new Error("always must the story exist")
                            }
                            updatedStoriesViewStates.push({
                                ...(({story, idHtml, ...rest}) => rest)(svs),
                                story: story,
                                idHtml: story.id
                            })
                        }
                    }
                    return updatedStoriesViewStates
                })
            }
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
            const {title,body, state} = story as Story
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
                <StoryContainer id={idHtml} key={idHtml}>
                    <OptionSelector id={htmlIds.state} processRefToValueHtmlElement={(r)=> (observe as Observe)(r, {mutation: "default"})}
                                    color={"#778899"} fontSize={"1.5rem"} options={Object.values(StoryState)} initSelectedOption={state}/>
                    <StoryTitleContainer>
                        <StoryTitle id={htmlIds.title} ref={r => {if(r) (observe as Observe)(r, {mutation: "default"})}} toDelete={toDelete} contentEditable={!toDelete}>
                            {title}
                        </StoryTitle>
                        {getOpenOrCloseStoryButton(isOpen, (e) => { openOrCloseStory(index) })}
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
        <>
            {editing && <PlusButton id={"plus-button"} color={"#FFFFFF"} size={26} onClick={handleAddNewStory}/>}
            <Container>
            <StoriesAnchorsContainer ref={storiesAnchorsRef} transparent={transparentStoriesAnchors} onClick={handleOnClickStoriesAnchors} onMouseOver={handleOnMouseOverStoriesAnchors} onMouseLeave={handleOnMouseLeaveStoriesAnchors}>
            <StoriesAnchorsTitle>stories index</StoriesAnchorsTitle>
            <StoriesAnchorsInnerContainer>
            {showStoriesAnchors &&
                storiesViewStates.map(({story: {title}}) =>
                    <StoryAnchorContainer>
                        <StoryAnchor href={"#" + title} onClick={handleOnClickStoryAnchor}>{title}</StoryAnchor>
                    </StoryAnchorContainer>
                )}
             </StoriesAnchorsInnerContainer>
            </StoriesAnchorsContainer>
            <StoriesContainer>
            {editing ? getEditableStoriesView() : getStoriesView()}
            </StoriesContainer>
            </Container>
        </>
    )
}

const Container = styled.div`
  width: 100%;
  background-color: #fff;
  background-image:
  linear-gradient(#eee .1em, transparent .1em);
  background-size: 100% 2.5em;
`
const StoriesAnchorsContainer = styled.div<{transparent: boolean}>` 
  position: sticky;
  align-self: flex-start;
  height: 0px;
  width: ${storiesAnchorsContainerWidth}px;
  top: 0px;
  opacity: ${({transparent}) => transparent ? 0.5 : 1};
  cursor: pointer;
`
const StoriesAnchorsInnerContainer = styled.ul`
  z-index: 2;
  margin: 0px;
  border-style: solid;
  border-color: ${mainColor};
  padding: 0px;
  background-color: ${secondColor};
`
const StoriesAnchorsTitle = styled.h3`
  color: white;
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  background-color: ${mainColor};
  padding: 5px;
  margin: 0px;
`
const StoryAnchorContainer = styled.li`
  list-style-type: none;
  border-bottom-style: solid;
  border-bottom-color: ${mainColor};
  padding: 5px;
  text-align: center;
  :last-of-type {
    border-bottom-style: none;
  }
`
const StoryAnchor = styled.a`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: white;
  :hover {
        color: ${mainColor};
    }
`
const StoriesContainer = styled.ul`
  padding: 0;
  margin: 0;
  width: 100%;
`
const StoryContainer = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  gap: 10px;
  list-style-type: none;
  padding-bottom: 15px;
  border-color: ${secondColor};
  border-width: medium;
  border-bottom-style: solid;
  margin-top: 15px;
  :last-of-type {
        border-bottom-style: none;
    }
`
const StoryBody = styled.div`
  color: #696969;
  line-height: 1.5;
  font-size: 3rem;
  padding: 6px;
  block-size: fit-content;
`
const StoryTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
  color: #FFFFFF;
  cursor: pointer;
`
const StoryTitle = styled.h4<{ toDelete?: boolean }>`
  font-size: 3.5rem;
  font-weight: bold;
  color: ${secondColor};
  border-bottom: solid 4px ${secondColor};
  padding-bottom: 5px;
  margin: 0px;
  text-align: center;
  ${props => 
    props.toDelete ? 
        "text-decoration: line-through;"
        + "text-decoration-color: red;"
        + "text-decoration-style: wavy;"
        : ""
} 
`