import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode } from "react"
import { isHtmlElement, positionCaretOn } from "../../../../utils/domManipulations"
import collapsedSelectionHandler from "../selection_handlers/collapsed"
import rangeSelectionHandler from "../selection_handlers/range"
import { Available, IfFirstExtendsThenSecond } from "utils/src/types"
import { GetLastSelectionData } from "../useHtmlEditor"
import { optionAttributeTypePrefix, Highlight } from "./useOptions"

export type OptionNode = Text | Element
//export type GetNewOptionNode<WT extends boolean, ON extends OptionNode> = WT extends true ? (text: string) => ON : WT extends false ? () => ON : (text?: string) => ON
export type GetNewOptionNode<WT extends boolean, ON extends OptionNode> = IfFirstExtendsThenSecond<WT, [[true, (t: string) => ON], [false, () => ON]]>
//export type CollapsedSelectionText<WT> = WT extends true ? string : undefined // 
export type CollapsedSelectionText<WT> = IfFirstExtendsThenSecond<WT, [[true, string], [false, undefined]]>
export type OnClickOptionEnd = () => void

//export type ModifyNewNodes<ON extends OptionNode, ONA extends Partial<ON>> = (attr: ONA) =>  void
//export type Finish = () =>  void
export type UpdateDOM<ON extends OptionNode, ONA extends Partial<ON>> = (attr: ONA) =>  void
export type AtAfterUpdateDOMEnd = () =>  void
export type ShowFormModal<ON extends OptionNode, ONA extends Partial<ON>> = (updateDOM: UpdateDOM<ON, ONA>) => void

export type OptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean> = {
  children: ReactNode
  type: string
  withText: WT
  getNewOptionNode: GetNewOptionNode<WT, ON>
  collapsedSelectionText?: CollapsedSelectionText<WT>
  insertInNewLine: boolean
  className?: string
  //onClickOptionEnd: OnClickOptionEnd
  getLastSelectionData: GetLastSelectionData
  highlight: Highlight
  atAfterUpdateDOMEnd: AtAfterUpdateDOMEnd
} & Available<ON, ONA, {showFormModal: ShowFormModal<ON, Exclude<ONA, undefined>>, insertNodesBeforeShowFormModal: boolean}>
export default function Option<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean>({children, type, withText, getNewOptionNode, collapsedSelectionText="new" + type, insertInNewLine, className, getLastSelectionData, highlight, atAfterUpdateDOMEnd, showFormModal, insertNodesBeforeShowFormModal}: OptionProps<ON, ONA, WT>) {
  const onClickHandler: MouseEventHandler = (e) => {
    //selectionHandler(optionType, getTargetOptionNode)
    const lastSelectionData = getLastSelectionData()
    if (lastSelectionData) {
        const newNodes: ON[] = []
        const onNewOptionNode = (newNode: ON) => {
          if (isHtmlElement(newNode)) {
            newNode.dataset[optionAttributeTypePrefix] = type
          }
          newNodes.push(newNode)
        }
        const getNewOptionNodeWrapper = (withText ? (text: string) => {
          const newNode = getNewOptionNode(text)
          onNewOptionNode(newNode)
          return newNode
        } : () => {
          const newNode = (getNewOptionNode as GetNewOptionNode<false, ON>)() // should infer it
          onNewOptionNode(newNode)
          return newNode
        }) as GetNewOptionNode<WT, ON>

        let selectionTargets: (Range | HTMLElement)[]
        let insertNodes: () => void
        if (lastSelectionData.type === "range") {
          const {ranges} = lastSelectionData
          selectionTargets = ranges
          insertNodes = () => {ranges.forEach(range => {rangeSelectionHandler({withText, getNewOptionNode: getNewOptionNodeWrapper, insertInNewLine, range})})}
        } else {
          let anchorNode, anchorOffset: number
          if (lastSelectionData.type === "collapsed") {
            const {range} = lastSelectionData
            selectionTargets = [range]
            const {startContainer, startOffset} = range
            anchorNode = startContainer
            anchorOffset = startOffset
          } else {
            const {element} = lastSelectionData
            selectionTargets = [element]
            anchorNode = element
            anchorOffset = 0
          }
          const newNode = withText ? getNewOptionNodeWrapper(collapsedSelectionText) : (getNewOptionNodeWrapper as GetNewOptionNode<false, ON>)()
          insertNodes = () => {collapsedSelectionHandler({newNode, insertInNewLine, anchorNode, anchorOffset})}
        }

        const afterUpdateDOM = () => {
          if (withText) {
            positionCaretOn(newNodes[newNodes.length - 1].firstChild as Text)
          } else {
          // ????
          }
          atAfterUpdateDOMEnd()
        }

        if (showFormModal) {
          type ONANU = Exclude<ONA, undefined>
          const updateNodes = (attr: ONANU) => {
              newNodes.forEach((n) => Object.assign(n, attr))
          }
          let updateDOM: UpdateDOM<ON, ONANU>
          if (insertNodesBeforeShowFormModal) {
            insertNodes()
            highlight(...newNodes)
            updateDOM = (attr) => {
              updateNodes(attr)
              afterUpdateDOM()
            } 
          } else {
            highlight(...selectionTargets)
            updateDOM = (attr) => {
              insertNodes()
              updateNodes(attr)
              afterUpdateDOM()
            }
          }
          showFormModal(updateDOM)
        } else {
          insertNodes()
          afterUpdateDOM()
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
