import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import useArrayRef from "../../../hooks/references/useArrayRef"
import useRef from "../../../hooks/references/useRef"
import useHtmlEditor from "../../../hooks/with_jsx/html_editor/useHtmlEditor"
import { Observe } from "../../../pages/user/edit_home"
import { NewStory, PropsByViewMode, Story, StoryHTMLElementIds, StoryWithJSXBody, ViewMode } from "../../../types/home"
import AddButton from "../edit/AddButton"
import Index from "./Index"
import StoryView, { EditingStory, StoryViewHandler } from "./StoryView"

const storiesAnchorsContainerWidth = 150

export type StoryStates = {htmlId: string, story: Story | StoryWithJSXBody | NewStory, toRemove: boolean}

type ReadingProps = {
    savedStories: (Story | StoryWithJSXBody)[]
}
type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type CreateNewStory = () => [string, NewStory]
type RemoveStory = (id: string) => void
type RecoverStory = (id: string) => void
type EditingProps = {
    savedStories: Story[]
    getHtmlElementIds: GetHtmlElementIds
    observe: Observe
    createNewStory: CreateNewStory
    removeStory: RemoveStory
    recoverStory: RecoverStory
}
type Props<VM extends ViewMode> = PropsByViewMode<VM, ReadingProps, EditingProps>

export default function StoriesView<VM extends ViewMode>({viewMode, ...restProps}: Props<VM>) {
    const [getContainerDiv, setContainerDiv] = useRef<HTMLDivElement>()

    // htmlId is use to identify the html element. Can be story id or index of new stories array
    const [storiesStates, setStoriesStates] = useState<StoryStates[]>(restProps.savedStories.map((s) => {
        return {htmlId: s.id, story: {...s}, toRemove: false}
    }))

   /*  const openOrCloseStory = (index: number) => {
        const updatedStoriesViewStates = [...storiesViewStates]
        updatedStoriesViewStates[index].isOpen = !updatedStoriesViewStates[index].isOpen
        setStoriesViewStates(updatedStoriesViewStates)
    }
    const getOpenOrCloseStoryButton = (isOpen: boolean, onClick?: (e: React.MouseEvent) => void) => <OpenOrCloseStoryButton size={25} color={secondColor} isOpen={isOpen} onClick={onClick}/>
 */
    
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
        

    /* const storiesRefHandlers = useRef<StoryRefHandler[]>([])
    const setStoryRefHandler = (srh: StoryRefHandler, index: number) => {
      storiesRefHandlers.current[index] = srh
    }
    const getStoriesRefHandlers = () => storiesRefHandlers.current */
    const [getStoriesViewsHandlers, setStoryViewHandler] = useArrayRef<(StoryViewHandler | undefined)[]>()

    let element
    if (viewMode === "reading") {
        element = <Container ref={setContainerDiv}>
                  <LeftContainer>
                  <Index storiesStates={storiesStates}/>
                  </LeftContainer>
                  <StoriesContainer>
                  {storiesStates.map(({htmlId, story}, index) => <StoryView viewMode="reading" htmlId={htmlId} story={story} ref={(svh) => {setStoryViewHandler(svh, index)}}/>)}
                  </StoriesContainer>
                  </Container>
    } else {
        const {getHtmlElementIds, observe, createNewStory, removeStory, recoverStory} = restProps as EditingProps

        const onClickAddButtonHandler: MouseEventHandler<SVGAElement> = (e) => {
            const [htmlId, story] = createNewStory()
            setStoriesStates((svs) => [...svs, {htmlId, story: {...story}, toRemove: false}])
            setTimeout(() => {
                getStoriesViewsHandlers().at(-1)?.focusBody()
            }, 300)
        }

        const doesStoriesBodiesContains = (node: Node) => !getStoriesViewsHandlers().every(svh => !svh || !svh.doesBodyContains(node))
        const {htmlEditorModal, targetEventHandlers} = useHtmlEditor({getContainerRect: () => getContainerDiv()?.getBoundingClientRect(), options: {defaultTextClassName: "fixe me"}, doesTargetContains: doesStoriesBodiesContains})

        element = <Container ref={setContainerDiv}>
                  {htmlEditorModal}
                  <LeftContainer>
                  <AddButton position="right" tooltipText="add story" onClickHandler={onClickAddButtonHandler}/>
                  <Index storiesStates={storiesStates}/>
                  </LeftContainer>
                  <StoriesContainer>
                  {storiesStates.map(({htmlId, story, toRemove}, index) => {
                     const removeStoryHandler = () => {
                        const isNew = !("id" in story)
                        removeStory(htmlId)
                        setStoriesStates( st => {
                            const nextStoriesStates = [...st]
                            if (isNew) {
                                nextStoriesStates.splice(index, 1)
                            } else {
                                nextStoriesStates[index].toRemove = true
                            }
                            return nextStoriesStates
                        })
                     }
                     const recoverStoryHandler = () => {
                        recoverStory(htmlId)
                        setStoriesStates( st => {
                            const nextStoriesStates = [...st]
                            nextStoriesStates[index].toRemove = false
                            return nextStoriesStates
                        })
                     }

                     return <StoryView viewMode="editing" htmlId={htmlId} getHtmlElementIds={getHtmlElementIds} observe={observe} removeStoryHandler={removeStoryHandler} recoverStoryHandler={recoverStoryHandler} story={story as EditingStory} toRemove={toRemove} ref={(svh) => {setStoryViewHandler(svh, index)}}/>}
                    )}
                  </StoriesContainer>
                  </Container> 
    }
    /* const getEditableStoriesView = () => storiesViewStates.map(({idHtml, story, isOpen, toDelete}, index) => {
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
                                                                   dangerouslySetInnerHTML={{__html: body}} {...targetEventHandlers} /* onMouseUp={onMouseUpHandler} onBlur={handleOnBlurBody} />
                                                </StoryContainer>
                                         }) 
    */

    /* return <Container ref={setContainerDiv}>
           {editing && htmlEditorModal}
           <LeftContainer>
           {editing && <AddButton position="right" tooltipText="add story" onClickHandler={onClickAddButtonHandler}/>}
           <Index storiesStates={storiesStates}/>
           </LeftContainer>
           <StoriesContainer>
           {editing ? getEditableStoriesView() : getStoriesView()}
           </StoriesContainer>
           </Container> */
        return element
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
