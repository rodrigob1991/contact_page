import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import { positionCaretOn } from "../../../../utils/domManipulations"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"
import { Available } from "utils/src/types"
import { GetLastSelectionData } from "../useHtmlEditor"
import { optionAttributeTypePrefix } from "./useOptions"

export type OptionNode = Text | Element
export type GetNewOptionNode<WT extends boolean, ON extends OptionNode> = WT extends true ? (text: string) => ON : WT extends false ? () => ON : (text?: string) => ON
export type CollapsedSelectionText<WT> = WT extends true ? string : undefined // 
export type SetHtmlEditorVisibleTrue = () => void

export type ModifyNewNodes<ON extends OptionNode, ONA extends Partial<ON>> = (attr: ONA) =>  void
export type Finish = () =>  void
export type ShowFormModal<ON extends OptionNode, ONA extends Partial<ON>> = (modifyNewNodes: ModifyNewNodes<ON, ONA>, finish: Finish) => void

export type OptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean> = {
  children: ReactNode
  type: string
  withText: WT
  getNewOptionNode: GetNewOptionNode<WT, ON>
  collapsedSelectionText?: CollapsedSelectionText<WT>
  insertInNewLine: boolean
  className?: string
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
  getLastSelectionData: GetLastSelectionData
} & Available<ON, ONA, {showFormModal: ShowFormModal<ON, Exclude<ONA, undefined>>}>
export default function Option<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean>({children, type, withText, getNewOptionNode, collapsedSelectionText=" ...", insertInNewLine, className, setHtmlEditorVisibleTrue, getLastSelectionData, showFormModal}: OptionProps<ON, ONA, WT>) {
  const onClickHandler: MouseEventHandler = (e) => {
    //selectionHandler(optionType, getTargetOptionNode)
    const lastSelectionData = getLastSelectionData()
    if (lastSelectionData) {
        const newNodes: ON[] = []
        const onNewOptionNode = (newNode: ON) => {
          if (newNode instanceof HTMLElement) {
            newNode.dataset[optionAttributeTypePrefix] = type
          }
          newNodes.push(newNode)
        }
        const getNewOptionNodeWrapper = (withText ? (text: string) => {
          const newNode = (getNewOptionNode as GetNewOptionNode<true, ON>)(text)
          onNewOptionNode(newNode)
          return newNode
        } : () => {
          const newNode = (getNewOptionNode as GetNewOptionNode<false, ON>)()  
          onNewOptionNode(newNode)
          return newNode
        }) as GetNewOptionNode<WT, ON>

        const {isCollapsed, anchorNode, anchorOffset, ranges} = lastSelectionData
        if (isCollapsed) {
          const optionNode = withText ? (getNewOptionNodeWrapper as GetNewOptionNode<true, ON>)(collapsedSelectionText) : (getNewOptionNodeWrapper as GetNewOptionNode<false, ON>)()
          collapsedSelectionHandler(optionNode, insertInNewLine, anchorNode as ChildNode, anchorOffset)
        } else {
          ranges.forEach(r => {rangeSelectionHandler(withText, getNewOptionNodeWrapper, insertInNewLine, r)})
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
          showFormModal(modifyNewNodes, finish)
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
