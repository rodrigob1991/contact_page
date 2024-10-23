import styled from "@emotion/styled"
import { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactElement, useEffect, useRef, useState } from "react"
import { isEmpty, upperCaseFirstChar } from "utils/src/strings"
import { IfOneOfFirstExtendsThenSecond } from "utils/src/types"
import Highlights from "../../../components/Highlights"
import { DoesContainsNode } from "../../../components/ResizableDraggableDiv"
import { GetRect } from "../../../types/dom"
import { getRelativeMousePosition, getRelativeRect, isHtmlElement, isInput, isText } from "../../../utils/domManipulations"
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
export type SelectionDataCollapsedType = {type: "collapsed", range: Range}
export type SelectionDataRangeType = {type: "range", ranges: Range[]}
export type SelectionDataElementType = {type: "element", element: HTMLElement}
export type SelectionType = (SelectionDataCollapsedType | SelectionDataRangeType | SelectionDataElementType)["type"]
export type SelectionData<T extends SelectionType=SelectionType> = {mousePosition: MousePosition, getRect: () => DOMRect & {isMouseAboveMiddle: boolean}} & IfOneOfFirstExtendsThenSecond<T, [["collapsed", SelectionDataCollapsedType], ["range", SelectionDataRangeType], ["element", SelectionDataElementType]]>
export type GetLastSelectionData = () => SelectionData | undefined
export type SetLastSelectionData = (selectionData: SelectionData | undefined) => void

type TargetEventHandlers = {onMouseUp: MouseEventHandler, onKeyUp: KeyboardEventHandler, onFocus: FocusEventHandler, onBlur: FocusEventHandler, onClick: MouseEventHandler, onDoubleClick: MouseEventHandler}
//type Return = ChangePropertyType<UseModalReturn<"htmlEditor">, ["setHtmlEditorModalVisible", SetVisibleOnSelection]> & {targetEventHandlers: TargetEventHandlers}
type Return = {htmlEditorModal: ReactElement}

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
    const {setColorsModalVisible, isColorsModalVisible, colorsModal, getColorsModalRect, doesColorsModalContainsNode} = useModal({name: "colors", children: colorsModalChildren, ...modalCommonProps})
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
    const setLastSelectionData: SetLastSelectionData = (lastSelectionData) => {
      lastSelectionDataRef.current = lastSelectionData
      let element
      if (lastSelectionData) {
        if (lastSelectionData.type === "element") {
          ({element} = lastSelectionData)
        }
      } 
      selectOptionElement(element)

      if (positionType === "selection")
        setVisibleOnSelection()
    }

    const mousePosition = useMousePosition()

    const lastClickedPositionRef = useRef<MousePosition>()
    const setLastClickedPosition = (mp?: MousePosition) => {lastClickedPositionRef.current = mp}
    const getLastClickedPosition = (target: HTMLElement, mp: MousePosition) => {
      let nearLastClick = false
      let nextLastClickedPosition

      const lastSelectionData = getLastSelectionData()
      let lastClickedTarget = undefined
      if (lastSelectionData) {
        switch (lastSelectionData.type) {
          case "element":
            lastClickedTarget = lastSelectionData.element
            break;
          case "collapsed":
            lastClickedTarget = lastSelectionData.range.startContainer.parentElement
        }
      }
      const lastClickedPosition = lastClickedPositionRef.current
      if (lastClickedTarget && lastClickedPosition && lastClickedTarget === target) {
          const {x, y} = mp
          const {x: lastX, y: lastY} = lastClickedPosition
          const diffX = lastX - x
          const diffY = lastY - y
          if (diffX < 10 && diffX > -10 && diffY < 10 && diffY > -10) {
            nearLastClick = true
          } else {
            nextLastClickedPosition = mp
          }
      } else {
        nextLastClickedPosition = mp
      }

      return {nearLastClick, lastClickedPosition: nextLastClickedPosition}
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
            if (isInput(target)) {
              if (doesModalsContains(target)) {
                lastSelectionDataChanged = false
              } else if (doesTargetContains(target)) {
                // for now lastSelectionData remain undefined
              }
            } 
            else { // target = document
              const selection = document.getSelection()
              if (selection) {
                const {anchorNode} = selection
                if (anchorNode) {
                  if (/* !isText(anchorNode) || */ doesModalsContains(anchorNode)) {
                    lastSelectionDataChanged = false
                  } else if (doesTargetContains(anchorNode)) {
                    const {isCollapsed, rangeCount} = selection
                    const ranges: Range[] = []
                    for (let i=0; i < rangeCount; i ++) {
                      ranges.push(selection.getRangeAt(i))
                    }
                    lastSelectionData = {...(isCollapsed ? {type: "collapsed", range: ranges[0]} : {type: "range", ranges}), ...getLastSelectionDataProps(ranges[0])}
                  } 
                }
              }
            }
          }
          if (lastSelectionDataChanged) {
            setLastSelectionData(lastSelectionData)
           /*  if (positionType === "selection")
              setVisibleOnSelection() */
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
        const {target} = e
        if (target && isHtmlElement(target) && !doesModalsContains(target)) {
          let lastClickedPosition
          if (doesTargetContains(target)) {
            if (e.detail === 1) {
              let nearLastClick
              ({nearLastClick, lastClickedPosition} = getLastClickedPosition(target, {x: e.clientX, y: e.clientY}))
            // this could be wrong
              const selectableTarget = !isEmpty(target.innerText)
              if ((selectableTarget && nearLastClick) || !selectableTarget) {
                setLastSelectionData({type: "element", element: target, ...getLastSelectionDataProps(target)})
              }
            }
          }
          setLastClickedPosition(lastClickedPosition)
        }
      }
      document.addEventListener("click", onClickHandler)

      return () => {
        document.removeEventListener("selectionchange", selectionChangeHandler)
        document.removeEventListener("click", onClickHandler)
      }
    }, [mousePosition])

    const atAfterUpdateDOMEnd = () => {
      // for now just visible on selection available
      //setVisibleOnSelection()
    }

    const getModalRelativeRect = () => getRelativeRect(getModalRect(), getContainerRect())

    const {options, formModal, setFormModalVisibleFalse, doesFormModalContainsNode, selectOptionElement, highlightsRects} = useOptions({positionType, getClassesNames: getOptionClassesNames, getContainerRect, getHtmlEditorRect: getModalRelativeRect, atAfterUpdateDOMEnd, getLastSelectionData, ...optionsSpecificProps})

    const children = <Container>
                     <Row>
                     <ColorView backgroundColor={selectedColor} onClick={onClickSelectedColorHandler}/>
                     </Row>
                     <Row>
                     {options}
                     </Row>
                     </Container>
    const {setModalVisible, getModalRect, doesModalContainsNode, modal, ...restReturn} = useModal({ children, positionType: positionType === "selection" ? "absolute" : positionType, position, ...modalCommonProps})
    
    const setVisibleOnSelection: SetVisibleOnSelection = () => {
        setColorsModalVisible(false)
        setFormModalVisibleFalse()
        //setHtmlEditorModalVisible(false)
        const lastSelectionData = getLastSelectionData()
        if (lastSelectionData) {
        // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one    
          setTimeout(() => { 
              const {width: containerWidth} = getContainerRect()
              const {height, width} = getModalRelativeRect()
              const {type, mousePosition, getRect: getSelectionRect} = lastSelectionData
              const {top: selectionTop, left: selectionLeft, height: selectionHeight, width: selectionWidth, bottom: selectionBottom, isMouseAboveMiddle} = getSelectionRect()

              let top 
              let left
              if (mousePosition) {
                top = selectionTop + (isMouseAboveMiddle ? -(height + 5) : selectionHeight + 5)
                left = type === "collapsed" ? selectionLeft : mousePosition.x 
              } else {
                top = selectionTop - height - 5
                left = selectionLeft
              }
              const leftOffset = left - (containerWidth - width)
              left -= leftOffset > 0 ? leftOffset : 0

              if (isColorsModalVisible()) {
                setColorsModalVisible(true, {top: `${top + height + 5}px`, left: `${left}px`})
              }
              setModalVisible(true, {top: `${top}px`, left: `${left}px`})
          })
        } else { setModalVisible(false) }
    }

    const doesModalsContains: DoesContainsNode = (node) => doesModalContainsNode(node) || doesColorsModalContainsNode(node) || doesFormModalContainsNode(node)
    
    return {
      htmlEditorModal: <>
                       {modal}
                       {colorsModal}
                       {formModal}
                       <Highlights rects={highlightsRects}/>
                       </>
    }
}

export const modalCommonProps = {draggable: false, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false,  onMouseDownHandler: (e: React.MouseEvent) => {e.preventDefault()}}

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