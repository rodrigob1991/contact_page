import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import { positionCaretOn } from "../../../../utils/domManipulations"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"

export type OptionNode = Text | Element
export type GetNewOptionNode<WT extends boolean, ON extends OptionNode> = WT extends true ? (text: string) => ON : WT extends false ? () => ON : (text?: string) => ON
export type CollapsedSelectionText<WT> = WT extends true ? string : undefined // 
export type SetHtmlEditorVisibleTrue = () => void

export type ModifyNewNodes<ON extends OptionNode, ONA extends Partial<ON>> = (attr: ONA) =>  void
export type Finish = () =>  void
export type ShowFormModal<ON extends OptionNode, ONA extends Partial<ON>> = (modifyNewNodes: ModifyNewNodes<ON, ONA>, finish: Finish) => void

export type OptionProps<WT extends boolean, ON extends OptionNode, ONA extends Partial<ON> | undefined> = {
  children: ReactNode
  withText: WT
  getNewOptionNode: GetNewOptionNode<WT, ON>
  collapsedSelectionText?: CollapsedSelectionText<WT>
  insertInNewLine: boolean
  className?: string
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
} & (ONA extends ON ? {showFormModal: ShowFormModal<ON, ONA>} : {})
export default function Option<WT extends boolean, ON extends OptionNode, ONA extends Partial<ON> | undefined>({children, withText, getNewOptionNode, collapsedSelectionText=" ...", insertInNewLine, showFormModal, className, setHtmlEditorVisibleTrue}: OptionProps<WT, ON, ONA>) {
  const onClickHandler: MouseEventHandler = (e) => {
    //selectionHandler(optionType, getTargetOptionNode)
    const selection = document.getSelection()
    if (selection) {
        const newNodes: OptionNode[] = []
        const getNewOptionNodeWrapper = (withText ? (text: string) => {
          const newNode = (getNewOptionNode as GetNewOptionNode<true, ON>)(text)
          newNodes.push(newNode)
          return newNode
        } : () => {
          const newNode = (getNewOptionNode as GetNewOptionNode<false, ON>)()  
          newNodes.push(newNode)
          return newNode
        }) as GetNewOptionNode<WT, ON>

        const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
        if (isCollapsed) {
          const optionNode = withText ? (getNewOptionNodeWrapper as GetNewOptionNode<true, ON>)(collapsedSelectionText) : (getNewOptionNodeWrapper as GetNewOptionNode<false, ON>)()
          collapsedSelectionHandler(optionNode, insertInNewLine, anchorNode as ChildNode, anchorOffset)
        } else {
          for (let i = 0; i < rangeCount; i++) {
            rangeSelectionHandler(withText, getNewOptionNodeWrapper, insertInNewLine, selection.getRangeAt(i))
          }
        }
        const finish = () => {
          if (withText) {
            positionCaretOn(newNodes[newNodes.length - 1].firstChild as Text)
            setHtmlEditorVisibleTrue()
          } else {
          // ????
          }
        }
        if (showFormModal) {
          type ONANU = Exclude<ONA, undefined>
          const modifyNewNodes = (attr: ONANU) => {
            newNodes.forEach((n) => Object.assign(n, attr))
          }
          (showFormModal as ShowFormModal<ON, ONANU>)(modifyNewNodes, finish)
        } else {
          finish()
        }
    }
  }

  return <Container {...{className}} onClick={onClickHandler}>
         {children}
         </Container>
}

const Container = styled.div`
  cursor: pointer;
  font-size: 25px;
`
