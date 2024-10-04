import styled from "@emotion/styled"
import { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactElement, useEffect, useRef, useState } from "react"
import { isEmpty, upperCaseFirstChar } from "utils/src/strings"
import { IfOneOfFirstExtendsThenSecond } from "utils/src/types"
import { DoesContainsNode } from "../../../components/ResizableDraggableDiv"
import SyntheticCaret, { SyntheticCaretProps } from "../../../components/SyntheticCaret"
import { GetRect } from "../../../types/dom"
import { getRelativeMousePosition, getRelativeRect } from "../../../utils/domManipulations"
import useModal, { ModalPosition, ModalPositionType } from "../useModal"
import useMousePosition from "../useMousePosition"
import { OptionNode } from "./options/Option"
import useOptions, { MapOptionNodeAttrToInputsProps, MapOptionNodeTo, UseOptionsProps } from "./options/useOptions"

const defaultColors = ["red", "blue", "green", "yellow", "black"]
const defaultGetColorClassName = (color: string) => "color" + upperCaseFirstChar(color) + "Option"

export type HtmlEditorPositionType = ModalPositionType | "selection"
type Position<PT extends HtmlEditorPositionType> = IfOneOfFirstExtendsThenSecond<PT, [["selection", ModalPosition], [ModalPositionType, undefined]]>

type Props<PT extends HtmlEditorPositionType, ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">> = {
    positionType: PT
    position?: Position<PT>
    getContainerRect: GetRect
    doesTargetContains: Node["contains"]
    colors?: string[]
    getColorClassName?: (color: string) => string
} & {options?: Omit<UseOptionsProps<ONS, ONAS, IPS, WTS>, "getContainerRect" | "getClassesNames" | "getHtmlEditorModalRect" | "getLastSelectionData" | "atAfterUpdateDOMEnd">}

type MousePosition = {x: number, y: number}
type SetVisibleOnSelection = (mousePosition?: MousePosition) => void
export type SelectionData = {isCollapsed: boolean, anchorNode: Node | undefined, anchorOffset: number, ranges?: Range[], getRect: () => DOMRect & {isMouseAboveMiddle: boolean}}
export type GetLastSelectionData = () => SelectionData | undefined
export type SetLastSelectionData = (selectionData: SelectionData | undefined) => void

type TargetEventHandlers = {onMouseUp: MouseEventHandler, onKeyUp: KeyboardEventHandler, onFocus: FocusEventHandler, onBlur: FocusEventHandler, onClick: MouseEventHandler, onDoubleClick: MouseEventHandler}
//type Return = ChangePropertyType<UseModalReturn<"htmlEditor">, ["setHtmlEditorModalVisible", SetVisibleOnSelection]> & {targetEventHandlers: TargetEventHandlers}
type Return = {htmlEditorModal: ReactElement} & {targetEventHandlers: TargetEventHandlers}

export default function useHtmlEditor<PT extends HtmlEditorPositionType, ONS extends OptionNode[]=[], ONAS extends MapOptionNodeTo<ONS, "attr">=MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>=MapOptionNodeAttrToInputsProps<ONS, ONAS> , WTS extends MapOptionNodeTo<ONS, "wt">=MapOptionNodeTo<ONS, "wt">>({positionType, position, getContainerRect, doesTargetContains, colors=defaultColors, getColorClassName=defaultGetColorClassName, options: optionsSpecificProps}: Props<PT, ONS, ONAS, IPS, WTS>) : Return {
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
    const {setColorsModalVisible, isColorsModalVisible, colorsModal, getColorsModalRect, doesColorsModalContainsNode} = useModal({name: "colors", children: colorsModalChildren, ...modalCommonProps, onMouseDownHandler: (e) => {e.preventDefault()}})
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

    const getOptionClassesNames = (className: string="") =>  getColorClassName(selectedColor) + " " + className

    const lastSelectionDataRef = useRef<SelectionData>()
    const getLastSelectionData: GetLastSelectionData = () => lastSelectionDataRef.current
    const setLastSelectionData: SetLastSelectionData = (lastSelectionData) => {lastSelectionDataRef.current = lastSelectionData}
    /* const setLastSelectionData: SetLastSelectionData = (mousePosition) => {
      let lastSelectionDataChanged = true
      let lastSelectionData = undefined
      const selection = document.getSelection()
      if (selection) {
        const anchorNode = selection.anchorNode
        if (anchorNode && doesTargetContains(anchorNode)) {
          const {isCollapsed, anchorOffset} = selection
          const ranges: Range[] = []
          for (let i=0; i < selection.rangeCount; i ++) {
            ranges.push(selection.getRangeAt(i))
          }
          lastSelectionData = {isCollapsed, anchorNode, anchorOffset, ranges, getRect: () => getRelativeRect(ranges[0].getBoundingClientRect(), getContainerRect())}
          //anchorNode.parentElement && outlineNodes(anchorNode.parentElement)
        } else if (doesModalsContainsNode(anchorNode)) {
          lastSelectionDataChanged = false
        }
      }
      if (lastSelectionDataChanged) {
        lastSelectionDataRef.current = lastSelectionData
      }

      return lastSelectionDataChanged
    } */

    const mousePosition = useMousePosition()

    useEffect(() => {
      const relativeMousePosition = getRelativeMousePosition(mousePosition, getContainerRect())
      const getRectProp = (target: Range | HTMLElement) => ({
        getRect: () => {
          const relativeRect = getRelativeRect(target.getBoundingClientRect(), getContainerRect())
          return {...relativeRect, isMouseAboveMiddle: relativeMousePosition.y > relativeRect.top + relativeRect.height / 2}
        }
      })

      const selectionChangeHandler = () => {
        let lastSelectionDataChanged = true
        let lastSelectionData: SelectionData | undefined = undefined
        const selection = document.getSelection()
        if (selection) {
          const anchorNode = selection.anchorNode
          if (anchorNode && doesTargetContains(anchorNode)) {
            const {isCollapsed, anchorOffset} = selection
            const ranges: Range[] = []
            for (let i=0; i < selection.rangeCount; i ++) {
              ranges.push(selection.getRangeAt(i))
            }
            lastSelectionData = {isCollapsed, anchorNode, anchorOffset, ranges, ...getRectProp(ranges[0])}
          } else if (doesModalsContainsNode(anchorNode)) {
            lastSelectionDataChanged = false
          }
        }
        if (lastSelectionDataChanged) {
          setLastSelectionData(lastSelectionData)
          if (positionType === "selection")
            setVisibleOnSelection(relativeMousePosition)
        }
      }
      document.addEventListener("selectionchange", selectionChangeHandler)

      const enterClickHandler = (type: string, target: EventTarget | null): target is HTMLElement => {
        let enter = false
        if (target instanceof HTMLElement && doesTargetContains(target)) {
          // this could be wrong
          const selectableTarget = !isEmpty(target.innerText)
          enter = type === "click" ?  !selectableTarget: selectableTarget
        }

        return enter
      }

      const onClickHandler = ({type, target}: MouseEvent) => {
        if (enterClickHandler(type, target)) {
            setLastSelectionData({isCollapsed: true, anchorNode: target, anchorOffset: 0, ...getRectProp(target)})
            if (positionType === "selection")
              setVisibleOnSelection(relativeMousePosition)
            selectOptionElement(target)
        }
      }
      document.addEventListener("click", onClickHandler)

      const onDoubleClickHandler = ({type, target}: MouseEvent) => {
        if (enterClickHandler(type, target))
           selectOptionElement(target)
      }
      document.addEventListener("dblclick", onDoubleClickHandler)

      return () => {
        document.removeEventListener("selectionchange", selectionChangeHandler)
        document.removeEventListener("click", onClickHandler)
        document.removeEventListener("dblclick", onDoubleClickHandler)
      }
    }, [mousePosition])

    const atAfterUpdateDOMEnd = () => {
      // for now just visible on selection available
      //setVisibleOnSelection()
    }

    const {options, formModal, setFormModalVisibleFalse, doesFormModalContainsNode, selectOptionElement} = useOptions({positionType, getClassesNames: getOptionClassesNames, getContainerRect, getHtmlEditorRect: () => getModalRect(), atAfterUpdateDOMEnd, getLastSelectionData, ...optionsSpecificProps})

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

    const {setModalVisible, getModalRect, doesModalContainsNode, modal, ...restReturn} = useModal({ children, positionType: positionType === "selection" ? "absolute" : positionType, position, onMouseDownHandler: (e) => {e.preventDefault()}, ...modalCommonProps})
    const getModalRelativeRect = () => getRelativeRect(getModalRect(), getContainerRect())
    
    const setVisibleOnSelection: SetVisibleOnSelection = (mousePosition) => {
        setColorsModalVisible(false)
        setFormModalVisibleFalse()
        //setHtmlEditorModalVisible(false)
        setSyntheticCaretStates({visible: false})
        const lastSelectionData = getLastSelectionData()
        if (lastSelectionData) {
        // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one    
          setTimeout(() => { 
              //const {height} = getModalRect()
              const {height, width} = getModalRelativeRect()
              const {width: containerWidth} = getContainerRect()
              const {isCollapsed, getRect} = lastSelectionData
              const {top: selectionTop, left: selectionLeft, height: selectionHeight, width: selectionWidth, bottom: selectionBottom, isMouseAboveMiddle} = getRect()

              // const rangeRelativeTop = rangeTop - containerTop
              // const rangeRelativeLeft = rangeLeft - containerLeft
              let top 
              let left
              if (mousePosition) {
                top = selectionTop + (isMouseAboveMiddle ? selectionHeight + 5 : -(height + 5))
                left = mousePosition.x 
              } else {
                top = selectionTop - height - 5
                left = selectionLeft
              }
              const leftOffset = left - (containerWidth - width)
              left -= leftOffset > 0 ? leftOffset : 0

              if (isCollapsed) {
                //setSyntheticCaretStates({visible: true, top: rangeRelativeTop, left: rangeRelativeLeft, height: rangeBottom - rangeTop, width: 3})
              }
              if (isColorsModalVisible()) {
                setColorsModalVisible(true, {top: `${top + height + 5}px`, left: `${left}px`})
              }
              setModalVisible(true, {top: `${top}px`, left: `${left}px`})
          })
        } else { setModalVisible(false) }
    }

    const doesModalsContainsNode: DoesContainsNode = (node) => doesModalContainsNode(node) || doesColorsModalContainsNode(node) || doesFormModalContainsNode(node)
    
    const targetEventHandlers: TargetEventHandlers = {
    /*   onMouseUp: (e) => {
        setLastSelectionData()
        setVisibleOnSelection({top: e.clientY, left: e.clientX})
      },
      onKeyUp: (e) => {
        setLastSelectionData()
        setVisibleOnSelection()
      }, 
      onFocus: (e) => {
        setLastSelectionData()
        setVisibleOnSelection()
      },
      onBlur: (e) => {
        const focusedTarget = e.relatedTarget
        if (!containsHtmlEditorModalAndFormModalNode(focusedTarget))
          setHtmlEditorModalVisible(false)
      },
      onClick: (e) => {
      }, */
      onDoubleClick: (e) => {
        const target = e.target
        modifyOptionElement(target)
      }
    }

    return {
      htmlEditorModal: <>
                       {modal}
                       {colorsModal}
                       {formModal}
                       <SyntheticCaret {...syntheticCaretStates}/>
                       </>,
      targetEventHandlers
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