import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"
import { positionCaretOn } from "../../../../utils/domManipulations"

export type OptionNode = Text | Element
export type GetNewOptionNode<WT extends boolean> = WT extends true ? (text: string) => OptionNode : () => OptionNode
export type CollapsedSelectionText<WT> = WT extends true ? string : undefined

export type ModifyNewNodes = (attr: unknown) =>  void
export type Finish = () =>  void
export type AskAttributes = (modifyNewNodes: ModifyNewNodes, finish: Finish) => void

export type OptionProps<WT extends boolean> = {
  children: ReactNode
  withText: WT
  getNewOptionNode: GetNewOptionNode<WT>
  collapsedSelectionText?: CollapsedSelectionText<WT>
  insertInNewLine: boolean
  askAttributes?: AskAttributes
  className?: string
  setHtmlEditorVisibleTrue: () => void
}
export default function Option<WT extends boolean>({children, withText, getNewOptionNode, collapsedSelectionText=" ...", insertInNewLine, askAttributes, className, setHtmlEditorVisibleTrue}: OptionProps<WT>) {
  const onClickHandler: MouseEventHandler = (e) => {
    //selectionHandler(optionType, getTargetOptionNode)
    const selection = document.getSelection()
    if (selection) {
        const newNodes: OptionNode[] = []
        const getNewOptionNodeWrapper = (withText ? (text: string) => {
          const newNode = (getNewOptionNode as GetNewOptionNode<true>)(text)
          newNodes.push(newNode)
          return newNode
        } : () => {
          const newNode = (getNewOptionNode as GetNewOptionNode<false>)()  
          newNodes.push(newNode)
          return newNode
        }) as GetNewOptionNode<WT>

        const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
        if (isCollapsed) {
          const optionNode = withText ? (getNewOptionNodeWrapper as GetNewOptionNode<true>)(collapsedSelectionText) : (getNewOptionNodeWrapper as GetNewOptionNode<false>)()
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
