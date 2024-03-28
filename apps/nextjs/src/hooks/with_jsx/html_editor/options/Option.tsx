import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"
import { positionCaretOn } from "../../../../utils/domManipulations"

export type OptionNode = Text | Element
export type GetNewOptionNode = (text?: string) => OptionNode

export type ModifyNewNodes = (attr: unknown) =>  void
export type Finish = () =>  void
export type AskAttributes = (modifyNewNodes: ModifyNewNodes, finish: Finish) => void

export type OptionProps = {
  children: ReactNode
  getNewOptionNode: GetNewOptionNode
  withText: boolean
  insertInNewLine: boolean
  askAttributes?: AskAttributes
  className?: string
  setHtmlEditorVisibleTrue: () => void
}
export default function Option({children, getNewOptionNode, withText, insertInNewLine, askAttributes, className, setHtmlEditorVisibleTrue}: OptionProps) {
  const onClickHandler: MouseEventHandler = (e) => {
    //selectionHandler(optionType, getTargetOptionNode)
    const selection = document.getSelection()
    if (selection) {
        const newNodes: OptionNode[] = []
        const getNewOptionNodeWrapper = (text?: string) => {
          const newNode = getNewOptionNode(text)
          newNodes.push(newNode)
          return newNode
        }
        const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
        if (isCollapsed) {
          collapsedSelectionHandler(getNewOptionNodeWrapper(), insertInNewLine, anchorNode as ChildNode, anchorOffset)
        } else {
          for (let i = 0; i < rangeCount; i++) {
            rangeSelectionHandler(getNewOptionNodeWrapper, withText, insertInNewLine, selection.getRangeAt(i))
          }
        }
        const finish = () => {
          if (withText) {
            positionCaretOn(newNodes[newNodes.length - 1])
            setHtmlEditorVisibleTrue()
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

  return <Container className={className} onClick={onClickHandler}>
         {children}
         </Container>
}

const Container = styled.div`
  cursor: pointer;
  font-size: 25px;
`
