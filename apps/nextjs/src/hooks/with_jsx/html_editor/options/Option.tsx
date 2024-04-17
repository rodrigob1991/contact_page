import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"
import { positionCaretOn } from "../../../../utils/domManipulations"
import { EmptyObject } from "utils/src/types"

export type OptionNode = Text | Element
export type GetNewOptionNode<WT extends boolean, ON extends OptionNode> = WT extends true ? (text: string) => ON : () => ON
export type CollapsedSelectionText<WT> = WT extends true ? string : undefined

export type ModifyNewNodes<ONA extends Partial<OptionNode>> = (attr: ONA) =>  void
export type Finish = () =>  void
export type AskAttributes<ON extends OptionNode, ONA extends Partial<ON>> = (modifyNewNodes: ModifyNewNodes<ONA>, finish: Finish) => void

export type OptionProps<WT extends boolean, ON extends OptionNode, ONA extends Partial<ON> | undefined> = {
  children: ReactNode
  withText: WT
  getNewOptionNode: GetNewOptionNode<WT, ON>
  collapsedSelectionText?: CollapsedSelectionText<WT>
  insertInNewLine: boolean
  className?: string
  setHtmlEditorVisibleTrue: () => void
} & (ONA extends Partial<ON> ? {askAttributes: AskAttributes<ON, ONA>} : EmptyObject)
export default function Option<WT extends boolean, ON extends OptionNode, ONA extends Partial<ON> | undefined>({children, withText, getNewOptionNode, collapsedSelectionText=" ...", insertInNewLine, askAttributes, className, setHtmlEditorVisibleTrue}: OptionProps<WT, ON, ONA>) {
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
        if (askAttributes) {
          const modifyNewNodes = (attr: unknown) => {
            newNodes.forEach(n => Object.assign(n, attr))
          }
          askAttributes(modifyNewNodes, finish)
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
