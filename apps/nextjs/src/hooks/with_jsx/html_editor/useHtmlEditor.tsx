import styled from "@emotion/styled"
import { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactElement, useEffect, useRef, useState } from "react"
import { isEmpty, upperCaseFirstChar } from "utils/src/strings"
import { IfOneOfFirstExtendsThenSecond } from "utils/src/types"
import { DoesContainsNode } from "../../../components/ResizableDraggableDiv"
import SyntheticCaret, { SyntheticCaretProps } from "../../../components/SyntheticCaret"
import { GetRect } from "../../../types/dom"
import { getRelativeMousePosition, getRelativeRect } from "../../../utils/domManipulations"
import useModal, { ModalPosition, ModalPositionType } from "../useModal"
import useMousePosition, { MousePosition } from "../useMousePosition"
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

type SetVisibleOnSelection = () => void
export type SelectionType = "collapsed" | "range" | "element"
export type SelectionDataRanges<T extends SelectionType> = 
export type SelectionData<T extends SelectionType> = {type: T, anchorNode: Node | undefined, anchorOffset: number, ranges?: SelectionDataRanges<T>, mousePosition: MousePosition, getRect: () => DOMRect & {isMouseAboveMiddle: boolean}}
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

    const lastClickedTargetRef = useRef<HTMLElement>()
    const setLastClickedTarget = (t: HTMLElement | undefined) => {lastClickedTargetRef.current = t}
    const lastClickedPositionRef = useRef<MousePosition>()
    const setLastClickedPosition = (mp: MousePosition | undefined) => {lastClickedPositionRef.current = mp}
    const getLastClickedPosition = (target: HTMLElement, mp: MousePosition) => {
      let nextLastClickedPosition

      const lastClickedTarget = lastClickedTargetRef.current
      const lastClickedPosition = lastClickedPositionRef.current
      if (lastClickedTarget && lastClickedPosition) {
        if (lastClickedTarget === target) {
          const {x, y} = mp
          const {x: lastX, y: lastY} = lastClickedPosition
          const diffX = lastX - x
          const diffY = lastY - y
          if (!(diffX < 10 && diffX > -10 && diffY < 10 && diffY > -10)) {
            nextLastClickedPosition = mp
          }
        }
      } else {
        nextLastClickedPosition = mp
      }
      return nextLastClickedPosition
    }

    useEffect(() => {
      const relativeMousePosition = getRelativeMousePosition(mousePosition, getContainerRect())

      const getLastSelectionDataProps = (target: Range | HTMLElement) => ({
        mousePosition: relativeMousePosition,
        getRect: () => {
          const relativeRect = getRelativeRect(target.getBoundingClientRect(), getContainerRect())
          return {...relativeRect, isMouseAboveMiddle: relativeMousePosition.y <= relativeRect.top + relativeRect.height / 2}
        }
      })

      const selectionChangeHandler = ({target}: Event) => {
          let lastSelectionDataChanged = true
          let lastSelectionData: SelectionData | undefined = undefined
          if (target) {
            if (target instanceof HTMLInputElement) {
              if (doesModalsContainsNode(target)) {
                lastSelectionDataChanged = false
              } else if (doesTargetContains(target)) {
                // for now lastSelectionData remain undefined
              }
            } 
            else { // target = document
              const selection = document.getSelection()
              console.log(selection)
              if (selection) {
                const anchorNode = selection.anchorNode
                if (anchorNode) { 
                  if (doesTargetContains(anchorNode)) {
                    const {isCollapsed, anchorOffset} = selection
                    const ranges: Range[] = []
                    for (let i=0; i < selection.rangeCount; i ++) {
                      ranges.push(selection.getRangeAt(i))
                    }
                    lastSelectionData = {isCollapsed, anchorNode, anchorOffset, ranges, ...getLastSelectionDataProps(ranges[0])}
                  } else if (doesModalsContainsNode(anchorNode)) {
                    lastSelectionDataChanged = false
                  }
                }
              }
            }
          }
          if (lastSelectionDataChanged) {
            console.log("SETED LAST SELECTION")
            setLastSelectionData(lastSelectionData)
            if (positionType === "selection")
              setVisibleOnSelection()
          }
      }
      document.addEventListener("selectionchange", selectionChangeHandler)

     /*  const enterOnClickHandler = (type: string, target: EventTarget | null): target is HTMLElement => {
        let enter = false
        if (target instanceof HTMLElement && doesTargetContains(target)) {
          // this could be wrong
          const selectableTarget = !isEmpty(target.innerText)
          enter = type === "click" ?  !selectableTarget: selectableTarget
        }

        return enter
      } */

      const onClickHandler = (e: MouseEvent) => {
        let lastClickedTarget = undefined
        let lastClickedPosition = undefined

        const target = e.target
        if (target instanceof HTMLElement && doesTargetContains(target)) {
          if (e.detail === 1) {
            lastClickedTarget = target
            lastClickedPosition = getLastClickedPosition(target, {x: e.clientX, y: e.clientY})
            const nearLastClick = !lastClickedPosition
          // this could be wrong
            const selectableTarget = !isEmpty(target.innerText)
            if (selectableTarget) {
              if (nearLastClick)
                selectOptionElement(target)
            } else {
              setLastSelectionData({isCollapsed: true, anchorNode: target, anchorOffset: 0, ...getLastSelectionDataProps(target)})
              if (positionType === "selection")
                setVisibleOnSelection()
              selectOptionElement(target)
            }
          } 
        }
        setLastClickedTarget(lastClickedTarget)
        setLastClickedPosition(lastClickedPosition)
      }
      document.addEventListener("click", onClickHandler)

      /* const onDoubleClickHandler = ({type, target}: MouseEvent) => {
        if (enterOnClickHandler(type, target))
           selectOptionElement(target)
      }
      document.addEventListener("dblclick", onDoubleClickHandler) */

      return () => {
        document.removeEventListener("selectionchange", selectionChangeHandler)
        document.removeEventListener("click", onClickHandler)
        ///document.removeEventListener("dblclick", onDoubleClickHandler)
      }
    }, [mousePosition])

    const atAfterUpdateDOMEnd = () => {
      // for now just visible on selection available
      //setVisibleOnSelection()
    }

    const getModalRelativeRect = () => getRelativeRect(getModalRect(), getContainerRect())

    const {options, formModal, setFormModalVisibleFalse, doesFormModalContainsNode, selectOptionElement} = useOptions({positionType, getClassesNames: getOptionClassesNames, getContainerRect, getHtmlEditorRect: getModalRelativeRect, atAfterUpdateDOMEnd, getLastSelectionData, ...optionsSpecificProps})

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
    
    const setVisibleOnSelection: SetVisibleOnSelection = () => {
        setColorsModalVisible(false)
        setFormModalVisibleFalse()
        //setHtmlEditorModalVisible(false)
        setSyntheticCaretStates({visible: false})
        const lastSelectionData = getLastSelectionData()
        if (lastSelectionData) {
        // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one    
          setTimeout(() => { 
              const {width: containerWidth} = getContainerRect()
              const {height, width} = getModalRelativeRect()
              const {isCollapsed, mousePosition, getRect: getSelectionRect} = lastSelectionData
              const {top: selectionTop, left: selectionLeft, height: selectionHeight, width: selectionWidth, bottom: selectionBottom, isMouseAboveMiddle} = getSelectionRect()

              let top 
              let left
              if (mousePosition) {
                top = selectionTop + (isMouseAboveMiddle ? -(height + 5) : selectionHeight + 5)
                left = isCollapsed ? selectionLeft : mousePosition.x 
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