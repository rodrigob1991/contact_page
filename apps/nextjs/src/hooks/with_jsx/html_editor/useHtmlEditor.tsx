import styled from "@emotion/styled"
import { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, useRef, useState } from "react"
import { upperCaseFirstChar } from "utils/src/strings"
import { ChangePropertyType } from "utils/src/types"
import { ContainsNode, EventsHandlers } from "../../../components/ResizableDraggableDiv"
import { GetRect } from "../../../types/dom"
import useModal, { UseModalReturn } from "../useModal"
import { OptionNode } from "./options/Option"
import useOptions, { MapOptionNodeAttrToInputsProps, MapOptionNodeTo, UseOptionsProps } from "./options/useOptions"
import SyntheticCaret, { SyntheticCaretProps } from "../../../components/SyntheticCaret"
import { createSpan } from "../../../utils/domManipulations"

const defaultColors = ["red", "blue", "green", "yellow", "black"]
const defaultGetColorClassName = (color: string) => "color" + upperCaseFirstChar(color) + "Option"

export type OutlineNodes = (...nodes: Node[]) => void
export type ReverseOutlineElements = () => void

export type SelectionData = {isCollapsed: boolean, anchorNode: Node | undefined, anchorOffset: number, ranges: Range[], rect: DOMRect}
export type GetLastSelectionData = () => SelectionData | undefined

type SetVisibleOnSelection = (mousePosition?: {top: number, left: number}) => void

type TargetEventHandlers = {onMouseUp: MouseEventHandler, onKeyUp: KeyboardEventHandler, onBlur: FocusEventHandler, onClick: MouseEventHandler, onDoubleClick: MouseEventHandler}

type Props<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">> = {
    getContainerRect: GetRect
    colors?: string[]
    getColorClassName?: (color: string) => string
} & EventsHandlers & Omit<UseOptionsProps<ONS, ONAS, IPS, WTS>, "getClassesNames" | "getHtmlEditorModalRect" | "setHtmlEditorVisibleTrue">

type Return = ChangePropertyType<UseModalReturn<"htmlEditor">, ["setHtmlEditorModalVisible", SetVisibleOnSelection]> & {targetEventHandlers: TargetEventHandlers}

export default function useHtmlEditor<ONS extends OptionNode[]=[], ONAS extends MapOptionNodeTo<ONS, "attr">=MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>=MapOptionNodeAttrToInputsProps<ONS, ONAS> , WTS extends MapOptionNodeTo<ONS, "wt">=MapOptionNodeTo<ONS, "wt">>({getContainerRect, colors=defaultColors, getColorClassName=defaultGetColorClassName, spanClassesNames, anchorClassName, extensionOptionsProps}: Props<ONS, ONAS, IPS, WTS>) : Return {
    /* const [elementId, setElementId] = useState<string>()
    const consumeElementId = () => {
        const id = elementId
        setElementId(undefined)
        return id
    }
    const [elementIdFormPosition, setElementIdFormPosition] = useState<ModalPosition>({top: "middle", left: "middle"})
    const {setElementIdFormModalVisible, elementIdFormModal} = useFormModal({name: "elementId", positionType: "absolute", position: elementIdFormPosition, buttonText: "add", inputsProps: {id: {type: "textInput"}}, submissionAction: ({id}) => {setElementId(id)}})
    const handleClickElementId: MouseEventHandler<HTMLSpanElement> = (e) => {
        setElementIdFormPosition({top: `${e.clientY - 20}px`, left: `${e.clientX + 20}px`})
        setElementIdFormModalVisible(true)
    } */

    const [selectedColor, setSelectedColor] = useState(colors[0])
    const colorsModalChildren = <ColorsModalChildrenContainer columns={Math.ceil(Math.sqrt(colors.length))}>
                                {colors.map(color => 
                                <ColorView backgroundColor={color} onClick={(e) => {setSelectedColor(color); setColorsModalVisible(false)}}/>
                                )}
                                </ColorsModalChildrenContainer>
    const {setColorsModalVisible, isColorsModalVisible, colorsModal, getColorsModalRect, containsColorsModalNode} = useModal({name: "colors", children: colorsModalChildren, ...modalCommonProps, onMouseDownHandler: (e) => {e.preventDefault()}})
    const onClickSelectedColorHandler: MouseEventHandler = (e) => {
      if (!isColorsModalVisible()) {
        const { top, left } = e.currentTarget.getBoundingClientRect()
        const { top: topContainer, left: leftContainer } = getContainerRect()
        const { height } = getColorsModalRect()
        setColorsModalVisible(true, {
          top: `${top - topContainer - height}px`,
          left: `${left - leftContainer}px`,
        })
      } else {
        setColorsModalVisible(false)
      }
    }

    const getOptionClassesNames = (className?: string) =>  getColorClassName(selectedColor) + (className ? " " + className : "")

    const refToOutlineNodes = useRef<Node[]>([])
    const setOutlineNodes = (nodes: Node[]) => {
      refToOutlineNodes.current = nodes
    }
    const getOutlineNodes = () => refToOutlineNodes.current
    const reverseOutlineNodes = () => {
      getOutlineNodes().forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.outlineStyle = "none"
        }else {
          node.parentElement?.replaceWith(node)
        }
      })
      setOutlineNodes([])
    }
    const outlineNodes: OutlineNodes = (...nodes) => {
      reverseOutlineNodes()
      nodes.forEach(node => {
        let outlinedElement
        if (node instanceof HTMLElement) {
          outlinedElement = node
        }else {
          outlinedElement = createSpan()
          outlinedElement.appendChild(node)
          node.parentElement?.replaceChild(outlinedElement, node)
        }  
        outlinedElement.style.outlineStyle = "solid"
      })
      setOutlineNodes(nodes)
    }

    const lastSelectionDataRef = useRef<SelectionData>()
    const getLastSelectionData = () => lastSelectionDataRef.current
    const setLastSelectionData = () => {
      let lastSelectionData = undefined
      let anchorNode = undefined
      const selection = document.getSelection()
      if (selection) {
        const {isCollapsed, anchorOffset} = selection
        anchorNode = selection.anchorNode ?? undefined
        const ranges = []
        for (let i=0; i < selection.rangeCount; i ++){
          ranges.push(selection.getRangeAt(i))
        }
        lastSelectionData = {isCollapsed, anchorNode, anchorOffset, ranges, rect: ranges[0].getBoundingClientRect()}
      }
      anchorNode &&  anchorNode.parentElement ? outlineNodes(anchorNode.parentElement) : reverseOutlineNodes()
      lastSelectionDataRef.current = lastSelectionData
    }

    const atAfterUpdateDOMEnd = () => {
      // for now just visible on selection available
      setVisibleOnSelection()
    }

    const {options, formModal, setFormModalVisibleFalse, containsFormModalNode, modifyOptionElement} = useOptions({spanClassesNames, anchorClassName, extensionOptionsProps, getClassesNames: getOptionClassesNames, getContainerRect, getHtmlEditorModalRect: () => getHtmlEditorModalRect(), outlineNodes, atAfterUpdateDOMEnd, getLastSelectionData})

    const [syntheticCaretStates, setSyntheticCaretStates] = useState<SyntheticCaretProps>({visible: false})
    
    // const sibling = <>
    //                 {colorsModal}
    //                 {/* {elementIdFormModal} */}
    //                 {formModal}
    //                 </>
    
    //const idOffClass = "idOff"
    //const idOnClass = "idOn"

    const children = <Container>
                     <Row>
                     <ColorView backgroundColor={selectedColor} onClick={onClickSelectedColorHandler}/>
                     </Row>
                     <Row>
                     {options}
                     </Row>
                     </Container>

    const {setHtmlEditorModalVisible, getHtmlEditorModalRect, containsHtmlEditorModalNode, htmlEditorModal, ...restReturn} = useModal({name: "htmlEditor", children, positionType: "absolute", onMouseDownHandler: (e) => {e.preventDefault()}, ...modalCommonProps})
    
    const setVisibleOnSelection: SetVisibleOnSelection = (mousePosition) => {
        setColorsModalVisible(false)
        setFormModalVisibleFalse()
        //setHtmlEditorModalVisible(false)
        setSyntheticCaretStates({visible: false})
        // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one
        setTimeout(() => { 
          const lastSelectionData = getLastSelectionData()
          if (lastSelectionData) {
            const {height} = getHtmlEditorModalRect()
            const {top: containerTop, left: containerLeft} = getContainerRect()
            const range = lastSelectionData.ranges[0]
            const {top: rangeTop, left: rangeLeft, height: rangeHeight, width: rangeWidth, bottom: rangeBottom} = range.getBoundingClientRect()
            const rangeRelativeTop = rangeTop - containerTop
            const rangeRelativeLeft = rangeLeft - containerLeft
            let top 
            let left
            if (mousePosition) {
              top = rangeRelativeTop + (mousePosition.top > rangeTop + rangeHeight / 2 ? rangeHeight + 5 : -(height + 5))
              left = mousePosition.left - containerLeft
            } else {
              top = rangeRelativeTop - height - 5
              left = rangeLeft
            }
            if (lastSelectionData.isCollapsed) {
              //setSyntheticCaretStates({visible: true, top: rangeRelativeTop, left: rangeRelativeLeft, height: rangeBottom - rangeTop, width: 3})
            }
            if (isColorsModalVisible()) {
              setColorsModalVisible(true, {top: `${top + height + 5}px`, left: `${left}px`})
            }
            setHtmlEditorModalVisible(true, {top: `${top}px`, left: `${left}px`})
          }
        })
    }

    const containsHtmlEditorModalAndFormModalNode: ContainsNode = (node) => containsHtmlEditorModalNode(node) || containsColorsModalNode(node) || containsFormModalNode(node)
    
    const targetEventHandlers: TargetEventHandlers = {
      onMouseUp: (e) => {
        setLastSelectionData()
        setVisibleOnSelection({top: e.clientY, left: e.clientX})
      },
      onKeyUp: (e) => {
        setLastSelectionData()
        setVisibleOnSelection()
      },
      onBlur: (e) => {
        const focusedTarget = e.relatedTarget
        if (!containsHtmlEditorModalAndFormModalNode(focusedTarget))
          setHtmlEditorModalVisible(false)
      },
      onClick: (e) => {
      },
      onDoubleClick: (e) => {
        const target = e.target
        modifyOptionElement(target)
      }
    }

    return {
      htmlEditorModal: <>
                       {htmlEditorModal}
                       {colorsModal}
                       {formModal}
                       <SyntheticCaret {...syntheticCaretStates}/>
                       </>,
      setHtmlEditorModalVisible: setVisibleOnSelection,
      getHtmlEditorModalRect,
      containsHtmlEditorModalNode: containsHtmlEditorModalAndFormModalNode,
      targetEventHandlers,
      ...restReturn,
    }
}

export const modalCommonProps = {draggable: false, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false,  /* onMouseDownHandler: (e: React.MouseEvent) => {e.preventDefault()} */}
//export const formModalCommonProps = {positionType: "absolute", showLoadingBars: false, ...modalCommonProps} as const

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 5px;
  background-color: #FFFFFF;
`
const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  background-color: #FFFFFF;
`
const ColorsModalChildrenContainer = styled.div<{columns: number}>`
  display: grid;
  grid-template-columns: repeat(${({columns}) => columns}, auto);
`
const ColorView = styled.div<{backgroundColor: string}>`
  background-color: ${({backgroundColor}) => backgroundColor};
  width: 20px;
  height: 20px;
  cursor: pointer;
`
/* const optionCss = css`
  font-size: 25px;
  cursor: pointer;
` */