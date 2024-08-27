import styled from "@emotion/styled"
import { StoryState } from "@prisma/client"
import { ForwardedRef, forwardRef, memo, useImperativeHandle} from "react"
import { Observe } from "../../../pages/user/edit_home"
import { secondColor } from "../../../theme"
import { NewStory, PropsByViewMode, Story, StoryHTMLElementIds, StoryWithJSXBody, ViewMode } from "../../../types/home"
import { RemoveOrRecoverButton } from "../../Buttons"
import OptionSelector from "../../forms/OptionSelector"
import useRef from "../../../hooks/references/useRef"

const storyStates = Object.values(StoryState)
const indexByStoryState = Object.fromEntries(storyStates.map((st, index) => [st, index]))

type CommonProps = { htmlId: string }

type EditingStory = Story | NewStory
type ReadingStory = EditingStory | StoryWithJSXBody

type ReadingProps = {
    story: ReadingStory
} & CommonProps

type GetHtmlElementIds = (id: string) => StoryHTMLElementIds
type RemoveStoryHandler = () => void
type RecoverStoryHandler = () => void
type EditingProps = {
    story: EditingStory
    toRemove: boolean
    observe: Observe
    getHtmlElementIds: GetHtmlElementIds
    removeStoryHandler: RemoveStoryHandler
    recoverStoryHandler: RecoverStoryHandler
} & CommonProps

type Props<VM extends ViewMode> = PropsByViewMode<VM, ReadingProps, EditingProps>

export type StoryViewHandler = {
    focusBody: () => void
    doesBodyContains: Node["contains"]
}

function StoryWithRef<VM extends ViewMode>({ viewMode, ...restProps }: Props<VM>, ref: ForwardedRef<StoryViewHandler>) {
  const [getBodyDiv, setBodyDiv] = useRef<HTMLDivElement>()
  useImperativeHandle(ref, () => 
      ({
        focusBody: () => {
          getBodyDiv()?.focus()
        },
        doesBodyContains: (node) => {
          const bodyDiv = getBodyDiv()
          return bodyDiv ? bodyDiv.contains(node) : false
        }
      })
  , [])

  if (viewMode === "reading") {
      const {htmlId, story: {title, body}} = restProps as ReadingProps
      
      return  <Container id={htmlId} key={htmlId}>
              <Title>
              {title}
              </Title>
              <Body ref={setBodyDiv}>
              {body}
              </Body>
              </Container>
  } else {
      const {htmlId, story, toRemove, observe, getHtmlElementIds, removeStoryHandler, recoverStoryHandler} = restProps as EditingProps
      const isNew = !("id" in story)
      const {title, body, state} = story
      const htmlIds = getHtmlElementIds(htmlId)

      return <Container id={htmlId} key={htmlId}>
             <OptionSelector id={htmlIds.state} processRefToValueHtmlElement={(r) => {observe(r, {mutation: "default"})}}
                             color={"#778899"} fontSize={"1.5rem"} options={Object.values(StoryState)} initSelectedOptionIndex={indexByStoryState[state]}/>
             <TitleContainer>
             <Title id={htmlIds.title} ref={h4 => {if (h4) observe(h4, {mutation: "default"})}} toRemove={toRemove} contentEditable={!toRemove}>
             {title}
             </Title>
             <RemoveOrRecoverButton color={"#778899"} initShowRemove={!toRemove} size={20} removeHandler={removeStoryHandler}
                                    recoverHandler={recoverStoryHandler}/>
             </TitleContainer>
             <Body id={htmlIds.body} contentEditable={!toRemove} ref={div => {setBodyDiv(div); if (div) observe(div, {mutation: {characterData: true, subtree: true, childList: true, attributeFilter: ["href", "src"]}})}}
                   dangerouslySetInnerHTML={{__html: body}} /* {...targetEventHandlers} onMouseUp={onMouseUpHandler} onBlur={handleOnBlurBody} *//>
             </Container>
  }
}

export default memo(forwardRef(StoryWithRef))

const Container = styled.li`
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
const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 15px;
  width: 100%;
  color: #FFFFFF;
`
const Title = styled.h4<{ toRemove?: boolean }>`
  font-size: 3.5rem;
  font-weight: bold;
  color: ${secondColor};
  border-bottom: solid 4px ${secondColor};
  padding-bottom: 5px;
  margin: 0px;
  text-align: center;
  outline-color: ${secondColor};
  ${props => 
    props.toRemove ? 
        "text-decoration: line-through;"
        + "text-decoration-color: red;"
        + "text-decoration-style: wavy;"
        : ""
} 
`
const Body = styled.div`
  color: #2c3338;
  line-height: 1.5;
  font-size: 3rem;
  text-align: justify;
  padding: 6px;
  &:focus {
    outline: none;
  }
`
    