import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import { upperCaseFirstChar } from "utils/src/strings"
import { ChangePropertyType } from "utils/src/types"
import { ContainsNode, EventsHandlers } from "../../../components/ResizableDraggableDiv"
import { GetRect } from "../../../types/dom"
import useModal, { UseModalReturn } from "../useModal"
import { OptionNode } from "./options/Option"
import useOptions, { MapOptionNodeTo, UseOptionsProps } from "./options/useOptions"

const defaultColors = ["red", "blue", "green", "yellow", "black"]
const defaultGetColorClassName = (color: string) => "color" + upperCaseFirstChar(color) + "Option"

type SetVisibleOnSelection = (visible: boolean, mousePosition?: {top: number, left: number}) => void

type Props<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, WTS extends MapOptionNodeTo<ONS, "wt">> = {
    getContainerRect: GetRect
    colors?: string[]
    getColorClassName?: (color: string) => string
} & EventsHandlers & Omit<UseOptionsProps<ONS, ONAS, WTS>, "getClassesNames" | "getHtmlEditorModalRect" | "setHtmlEditorVisibleTrue">

type Return = ChangePropertyType<UseModalReturn<"htmlEditor">, ["setHtmlEditorModalVisible", SetVisibleOnSelection]>

export default function useHtmlEditor<ONS extends OptionNode[]=[], ONAS extends MapOptionNodeTo<ONS, "attr">=MapOptionNodeTo<ONS, "attr", undefined>, WTS extends MapOptionNodeTo<ONS, "wt">=MapOptionNodeTo<ONS, "wt", true>>({getContainerRect, colors=defaultColors, getColorClassName=defaultGetColorClassName, spanClassesNames, linkClassName, extensionOptionsProps}: Props<ONS, ONAS, WTS>) : Return {
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
    const {setColorsModalVisible, isColorsModalVisible, colorsModal, getColorsModalRect, containsColorsModalNode} = useModal({name: "colors", children: colorsModalChildren, ...modalCommonProps})
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

    // const getFormModalPosition = (formModalHeight: number): ModalPosition => {
    //   const rangeTop = document.getSelection()?.getRangeAt(0).getBoundingClientRect().top
    //   const {top, left, height} = getHtmlEditorModalRect()
    //   const {top: containerTop, left: containerLeft} = getContainerRect()
    //   return {top: `${top - containerTop + (((rangeTop ?? 0) > top) ? -formModalHeight-5 : height + 5)}px`, left: `${left - containerLeft}px`}
    // }
    const {options, formModal, containsFormModalNode} = useOptions({ spanClassesNames, linkClassName, extensionOptionsProps, getClassesNames: getOptionClassesNames, getContainerRect, getHtmlEditorModalRect: () => getHtmlEditorModalRect(), setHtmlEditorVisibleTrue: () => {setVisibleOnSelection(true)}})

    // const [syntheticCaretStates, setSyntheticCaretStates] = useState({visible: false, top: 0, left: 0, height: 0, width: 0})
    
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
    
    const setVisibleOnSelection: SetVisibleOnSelection = (visible, mousePosition) => {
        setColorsModalVisible(false)
        //setImageFormModalVisible(false)
        //setLinkFormModalVisible(false)
        setHtmlEditorModalVisible(false)
        if (visible) {
          // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one
          setTimeout(() => { 
            const selection = document.getSelection()
            if (selection) {
              const {height} = getHtmlEditorModalRect()
              const {top: containerTop, left: containerLeft} = getContainerRect()
              const range = selection.getRangeAt(0)
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
              // if (selection.isCollapsed) {
              //   setSyntheticCaretStates({visible: true, top: rangeRelativeTop, left: rangeRelativeLeft, height: rangeBottom - rangeTop, width: 3})
              // }
              if (isColorsModalVisible()) {
                setColorsModalVisible(true, {top: `${top + height + 5}px`, left: `${left}px`})
              }
              setHtmlEditorModalVisible(true, {top: `${top}px`, left: `${left}px`})
            }
          })
        } else {
        }
    }
    const containsHtmlEditorModalAndFormModalNode: ContainsNode = (node) => containsHtmlEditorModalNode(node) || containsColorsModalNode(node) || containsFormModalNode(node) 
    
    return {
      htmlEditorModal: <>
                       {htmlEditorModal}
                       {colorsModal}
                       {formModal}
                       </>,
      setHtmlEditorModalVisible: setVisibleOnSelection,
      getHtmlEditorModalRect,
      containsHtmlEditorModalNode: containsHtmlEditorModalAndFormModalNode,
      ...restReturn,
    }
}
export const modalCommonProps = {draggable: false, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false, /* onMouseDownHandler: (e: React.MouseEvent) => {e.preventDefault()} */}
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