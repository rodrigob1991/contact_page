import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { StoryState } from "@prisma/client"
import React, { MouseEventHandler, TouchEventHandler, memo, useEffect, useRef, useState } from "react"
import useHtmlEditor from "../../../hooks/with_jsx/html_editor/useHtmlEditor"
import { Observe } from "../../../pages/user/edit_home"
import { mainColor, secondColor } from "../../../theme"
import { NewStory, PropsByViewMode, Story, StoryHTMLElementIds, StoryWithJSXBody, ViewMode } from "../../../types/home"
import { DeleteOrRecoverButton, OpenOrCloseStoryButton } from "../../Buttons"
import { OptionSelector } from "../../FormComponents"
import AddButton from "../edit/AddButton"
import { EditingStory, ReadingStory } from "./StoryView"

const storiesAnchorsContainerWidth = 150

export type StoryViewStates = {htmlId: string, story: Story | StoryWithJSXBody | NewStory, toRemove: boolean}

type ReadingProps = {
    savedStories: (Story | StoryWithJSXBody)[]
}
type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type CreateNewStory = () => [string, NewStory]
type RemoveStory = (id: string) => void
type RecoverStory = (id: string) => void
type EditingProps = {
    savedStories: Story[]
    observe: Observe
    createNewStory: CreateNewStory
    getHtmlElementIds: GetHtmlElementIds
    removeStory: RemoveStory
    recoverStory: RecoverStory
}
type Props<VM extends ViewMode> = PropsByViewMode<VM, ReadingProps, EditingProps>

export default function StoriesView<VM extends ViewMode>({viewMode, savedStories, ...restProps}: Props<VM>) {
    const containerDivRef = useRef<HTMLDivElement>()
    const getContainerDiv = () => containerDivRef.current

    // htmlId is use to identify the html element. Can be story id or index of new stories array
    const [storiesViewStates, setStoriesViewStates] = useState<StoryViewStates[]>(savedStories.map((s) => {
        return {htmlId: s.id, story: s, toRemove: false}
    }))

   /*  const openOrCloseStory = (index: number) => {
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].isOpen = !updatedStoriesViewStates[index].isOpen
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const getOpenOrCloseStoryButton = (isOpen: boolean, onClick?: (e: React.MouseEvent) => void) => <OpenOrCloseStoryButton size={25} color={secondColor} isOpen={isOpen} onClick={onClick}/>
 */
    const [showStoriesAnchors, setShowStoriesAnchors] = useState(true)
    const [transparentStoriesAnchors, setTransparentStoriesAnchors] = useState(true)

    const onClickStoriesAnchorsHandler: MouseEventHandler<HTMLDivElement> = (e) => {
      e.stopPropagation()
      setShowStoriesAnchors((showStoriesAnchors) => {
        let nextShowStoriesAnchors
        let nextTransparentStoriesAnchors
        if (showStoriesAnchors) {
            if (transparentStoriesAnchors){
                nextShowStoriesAnchors = true
                nextTransparentStoriesAnchors = false
            } else{
                nextShowStoriesAnchors = false
                nextTransparentStoriesAnchors = true
            }
        } else {
            nextShowStoriesAnchors = true
            nextTransparentStoriesAnchors = false
        }
        setTransparentStoriesAnchors(nextTransparentStoriesAnchors)
        
        return nextShowStoriesAnchors
    })
    }
    const onTouchStoriesAnchorsHandler: TouchEventHandler<HTMLDivElement> = (e) => {
    }
    const onMouseLeaveStoriesAnchorsHandler: MouseEventHandler<HTMLDivElement> = (e) => {
      setTransparentStoriesAnchors(true)
    }
    const onMouseOverStoriesAnchorsHandler: MouseEventHandler<HTMLDivElement> = (e) => {
        setTransparentStoriesAnchors(!showStoriesAnchors)
      }
    const onClickStoryAnchorHandler: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.stopPropagation()
    }
    const storiesAnchorsRef = useRef<HTMLDivElement>()
    useEffect(()=> {
        document.addEventListener("touchstart", (e) => {
         const storiesAnchors = storiesAnchorsRef.current as HTMLDivElement
         if(!(storiesAnchors.contains(e.target as Node))){
            setTransparentStoriesAnchors(true)
         }
        })
    },[])
/* 
    const getStoriesView = () => storiesViewStates.map(({idHtml, story: {title, body}, isOpen}, index) => {
                                 return <StoryContainer id={idHtml} key={idHtml}>
                                        <StoryTitle>
                                        {title}
                                        </StoryTitle>
                                        {isOpen && 
                                        <StoryBody>
                                        {body}
                                        </StoryBody>
                                        }
                                        </StoryContainer>
                                 }) */
    // this effect is for maintain the previous states when saving stories
    /* useEffect(() => {
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
        [stories]) */

    const storiesBodiesDivRef = useRef<HTMLDivElement[]>([])
    const setStoryBodyDiv = (div: HTMLDivElement, index: number) => {
      storiesBodiesDivRef.current[index] = div
    }
    const getStoriesBodiesDiv = () => storiesBodiesDivRef.current

    const handleAddNewStory: MouseEventHandler<SVGAElement> = (e) => {
        const [idHtml, newStory] = (createNewStory as GetNewStory)()
        setStoriesViewStates((svs) => {
                return [...svs, {idHtml: idHtml, story: newStory, isOpen: true, toDelete: false}]
            }
        )
        setTimeout(() => {
          getStoriesBodiesDiv()[getStoriesBodiesDiv().length -1].focus()
        }, 300)
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

    const doesStoriesBodiesContainNode = (node: Node) => !getStoriesBodiesDiv().every(d => !d.contains(node))
    const {htmlEditorModal, targetEventHandlers} = useHtmlEditor({getContainerRect: () => getContainer().getBoundingClientRect(), options: {defaultTextClassName: storyBodyStyle.name}, doesTargetContainNode: doesStoriesBodiesContainNode})

    const getEditableStoriesView = () => storiesViewStates.map(({idHtml, story, isOpen, toDelete}, index) => {
                                         const {title,body, state} = story as Story
                                         const htmlIds = (getHtmlElementIds as GetHtmlElementIds)(idHtml)

                                         return <StoryContainer id={idHtml} key={idHtml}>
                                                <OptionSelector id={htmlIds.state} processRefToValueHtmlElement={(r)=> {(observe as Observe)(r, {mutation: "default"})}}
                                                                color={"#778899"} fontSize={"1.5rem"} options={Object.values(StoryState)} initSelectedOption={state}/>
                                                <StoryTitleContainer>
                                                <StoryTitle id={htmlIds.title} ref={r => {if(r) (observe as Observe)(r, {mutation: "default"})}} toDelete={toDelete} contentEditable={!toDelete}>
                                                {title}
                                                </StoryTitle>
                                                <DeleteOrRecoverButton color={"#778899"} initShowDelete={!toDelete} size={20} handleDelete={() => {handleDeleteStory(idHtml, index, !("id" in story))}}
                                                                       handleRecover={() => {handleRecoverStory(idHtml, index)}}/>
                                                </StoryTitleContainer>
                                                <div css={storyBodyStyle} id={htmlIds.body} contentEditable={!toDelete}
                                                                   ref={div => {if(div) {setStoryBodyDiv(div, index); (observe as Observe)(div, {mutation: {characterData: true, subtree: true, childList: true, attributeFilter: ["href", "src"]}})}}}
                                                                   dangerouslySetInnerHTML={{__html: body}} {...targetEventHandlers} /* onMouseUp={onMouseUpHandler} onBlur={handleOnBlurBody} *//>
                                                </StoryContainer>
                                         })

    return <Container ref={containerRef}>
           {editing && htmlEditorModal}
           <LeftContainer>
           {editing && <AddButton position="right" tooltipText="add story" onClickHandler={onClickAddButtonHandler}/>}
           <StoriesAnchorsContainer ref={storiesAnchorsRef} transparent={transparentStoriesAnchors} onClick={handleOnClickStoriesAnchors} onTouchStart={handleOnTouchStoriesAnchors} onMouseOver={handleOnMouseOverStoriesAnchors} onMouseLeave={handleOnMouseLeaveStoriesAnchors}>
           <StoriesAnchorsTitle>stories index</StoriesAnchorsTitle>
           {showStoriesAnchors &&
           <StoriesAnchorsInnerContainer>
           {storiesViewStates.map(({idHtml, story: {title}}) =>
           <StoryAnchorContainer>
           <StoryAnchor href={"#" + idHtml} onClick={handleOnClickStoryAnchor}>
           {title}
           </StoryAnchor>
           </StoryAnchorContainer>
           )}
           </StoriesAnchorsInnerContainer>
           }
           </StoriesAnchorsContainer>
           </LeftContainer>
           <StoriesContainer>
           {editing ? getEditableStoriesView() : getStoriesView()}
           </StoriesContainer>
           </Container>
}

const Container = styled.div`
  position: relative;
  width: 100%;
  background-color: #fff;
`
const LeftContainer = styled.div` 
  position: sticky;
  width: ${storiesAnchorsContainerWidth}px;
  height: 0px;
  top: 0px;
`
const StoriesAnchorsContainer = styled.div<{transparent: boolean}>` 
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
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  padding-left: 8vw;
  padding-right: 8vw;
  width: 100%;
  align-items: center;
  justify-content: center;
`
/* const MemoizedStoryBody = memo<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>((props) =>
  <div css={storyBodyStyle} {...props}/>) */
