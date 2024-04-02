import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import { upperCaseFirstChar } from "utils/src/strings"
import { ChangePropertyType } from "utils/src/types"
import { EventsHandlers } from "../../../components/ResizableDraggableDiv"
import SyntheticCaret from "../../../components/SyntheticCaret"
import { ImageData } from "../../../components/forms/ImageSelector"
import { GetRect } from "../../../types/dom"
import { createSpan, createText } from "../../../utils/domManipulations"
import useFormModal from "../forms/useFormModal"
import useModal, { ModalPosition, UseModalReturn } from "../useModal"
import Option from "./options/Option"
import useImageOption from "./options/with_form/useImageOption"
import useLinkOption from "./options/with_form/useLinkOption"

const optionsTypesWithForm = {link: "link", image: "image"} as const
type OptionTypeWithForm = keyof typeof optionsTypesWithForm
const isWithForm = (ot: OptionType) : ot is OptionTypeWithForm => ot in optionsTypesWithForm

const optionsTypesWithoutForm = {defaultText: "defaultText", span: "span"} as const
type OptionTypeWithoutForm = keyof typeof optionsTypesWithoutForm
const isWithoutForm = (ot: OptionType) : ot is OptionTypeWithoutForm => ot in optionsTypesWithoutForm

export type OptionType = OptionTypeWithForm | OptionTypeWithoutForm
export type TargetOptionNode<OT extends OptionType = OptionType> = {defaultText: Text, span: HTMLSpanElement, link: HTMLAnchorElement, image: HTMLDivElement}[OT]

type ElementOptionType = Exclude<OptionType, "defaultText">
type ElementOptionTarget<OT extends ElementOptionType = ElementOptionType> = TargetOptionNode<OT>

export type OptionTypeWithoutImage = Exclude<OptionType, "image"> 

type ClassName<OT extends OptionType> = OT extends "span" | "link" ? string : undefined 

type HandleSelection = (getOptionTargetNode: GetTargetOptionNode) => void

type ImageOptionAttr = ImageData & {height: number, width: number}
type InsertOrModifyImage = (ip: ImageOptionAttr) => void
type RemoveImage = () => void

type InsertLink = (hRef: string) => void

type SetVisibleOnSelection = (visible: boolean, mousePosition?: {top: number, left: number}) => void

type Props = {
    getContainerRect: GetRect
    colors?: string[]
    getColorClassName?: (color: string) => string
    spanClassesNames?: string[]
    linkClassName?: string
} & EventsHandlers
type Return = ChangePropertyType<UseModalReturn<"htmlEditor">, ["setHtmlEditorModalVisible", SetVisibleOnSelection]>

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
const defaultLinkClassName = "linkOption"
const defaultColors = ["red", "blue", "green", "yellow", "black"]
const defaultGetColorClassName = (color: string) => "color" + upperCaseFirstChar(color) + "Option"

export default function useHtmlEditor({getContainerRect, colors=defaultColors, getColorClassName=defaultGetColorClassName, spanClassesNames=defaultSpanClassesNames, linkClassName=defaultLinkClassName, ...modalProps}: Props) : Return {
    const [elementId, setElementId] = useState<string>()
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
    }

    //const getCommonElementOptionAttr = () => ({tabIndex: -1, id: consumeElementId()})

    /* const handleClickOptionWithForm = (optionType: OptionTypeWithForm, handleSelection: HandleSelection) => {
      let setVisible: SetModalVisible
      let formModalHeight: number

      switch (optionType) {
        case "link":
          let lastLinkAdded: HTMLAnchorElement
            updateInsertLink((url) => {
              const getTargetOptionLink: GetTargetOptionNode<"link"> = (t, isLast) => {
                const link = createAnchor({innerHTML: t, href: url, ...getCommonElementOptionAttr()})
                //link.href = hRef
                if (isLast) {
                  lastLinkAdded = link
                }
                return link
              }
              handleSelection(getTargetOptionLink)
              setTimeout(() => {
                positionCaretOn(lastLinkAdded)
              }, 100)
            })
          setVisible = setLinkFormModalVisible
          formModalHeight = getLinkFormModalRect().height
          break
        case "image":
          updateInsertOrModifyImage(({dataUrl, name, extension, ...dimensions}) => {
            const getTargetOptionImage: GetTargetOptionNode<"image"> = () => {
              const div = createDiv({
                props: {contentEditable: "false"},
                styles: {width: "100%", height: "fit-content", justifyContent: "center", display: "flex"}
              })
              const imageElement = createImage({src: dataUrl, ...dimensions, ...getCommonElementOptionAttr()})
              imageElement.dataset.name = name
              imageElement.dataset.extension = extension
              imageElement.setAttribute("onclick",`{window.modifyImageElement(this)}`)
              div.append(imageElement)
              return div
            }
            handleSelection(getTargetOptionImage)
          })
          setVisible = setImageFormModalVisible
          formModalHeight = getImageFormModalRect().height
          break
      }

      setVisible(true, getOptionFormModalPosition(formModalHeight))
    } */
   /*  const handleClickOptionWithoutForm = (optionType: OptionTypeWithoutForm, handleSelection: HandleSelection, className: ClassName<OptionTypeWithoutForm>) => {
        let getTargetOptionNode: GetTargetOptionNode<OptionTypeWithoutForm>
        let lastText: Text
        switch (optionType) {
            case "defaultText":
                getTargetOptionNode = (t, isLast) => {
                    const defaultText = createText(t)
                    if (isLast) {
                        lastText = defaultText
                    }
                    return defaultText
                }
                break
            case "span":
                getTargetOptionNode = (t, isLast) => {
                    const span = createSpan({innerHTML: t, className, ...getCommonElementOptionAttr()})
                    if (isLast) {
                        lastText = span.firstChild as Text
                    }
                    return span
                }
                break
        }
        handleSelection(getTargetOptionNode)
        setTimeout(() => {
            positionCaretOn(lastText)
            setVisibleOnSelection(true)
        })
    }
    const handleClickPalletOption = <OT extends OptionType>(optionType: OT, className: ClassName<OT>) => {
        const selection = document.getSelection()
        if (selection) {
            const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
            const ranges : Range[] = []
            for (let i = 0; i < rangeCount; i++) {
                ranges.push(selection.getRangeAt(i))
            }

            const handleSelection = (getTargetOptionNode: GetTargetOptionNode) => {
                if (isCollapsed) {
                    collapsedSelectionHandler(optionType, getTargetOptionNode, anchorNode as ChildNode, anchorOffset)
                } else {
                    if (optionType !== "image") {
                    ranges.forEach((r) => {rangeSelectionHandler(optionType, getTargetOptionNode, r)})
                    }
                }
            }
            
            if (isWithForm(optionType)) {
                //const {y: rectTop,x: rectLeft} = ranges[0].getBoundingClientRect()
                handleClickOptionWithForm(optionType, handleSelection)

            } else {
                handleClickOptionWithoutForm(optionType, handleSelection, className)
            }
        }
    } */

    const [selectedColor, setSelectedColor] = useState(colors[0])
    const colorsModalChildren = <ColorsModalChildrenContainer columns={Math.ceil(Math.sqrt(colors.length))}>
                                {colors.map(color => 
                                <ColorOption backgroundColor={color} onClick={(e) => {setSelectedColor(color); setColorsModalVisible(false)}}/>
                                )}
                                </ColorsModalChildrenContainer>
    const {setColorsModalVisible, isColorsModalVisible, colorsModal, getColorsModalRect} = useModal({name: "colors", children: colorsModalChildren, ...formModalCommonProps})
    const onClickSelectedColorOptionHandler: MouseEventHandler = (e) => {
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

   /*  const linkFormInputsProps = {
        href: {type: "textInput", props: {placeholder: "url"}}
    } as const
    const linkFormModalSubmissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
    }
    const [linkFormModalPropsRest, setLinkFormModalPropsRest] = useState({inputsProps: linkFormInputsProps, submissionAction: linkFormModalSubmissionAction})
    const {setLinkFormModalVisible, linkFormModal, getLinkFormModalRect} = useFormModal({name: "link", ...linkFormModalPropsRest, ...formModalCommonProps})
    const askLinkAttributes: AskAttributes = (modifyNewNodes, finish) => {
      const submissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
        modifyNewNodes(values)
        finish()
      }
      setLinkFormModalPropsRest({inputsProps: linkFormInputsProps, submissionAction})
      setLinkFormModalVisible(true, getFormModalPosition(getLinkFormModalRect().height))
    } */

    /* const imageFormInputsProps = {
        imageData: {type: "imageSelector"},
        height: {type: "numberInput"},
        width: {type: "numberInput"},
        //remove: {type: "checkbox", props: {label: "remove"}}
    } as const
    const removeImageFormInputsProps = {
      remove: {type: "checkbox", props: {label: "remove"}}
    } as const
    const imageFormSubmissionAction: SubmissionAction<typeof imageFormInputsProps> = ({remove, imageData, ...dimensions}) => {
        if (remove) {
            removeImage()
        } else {
            insertOrModifyImage({...imageData, ...dimensions})
        }
    }
    const {setImageFormModalVisible, imageFormModal, getImageFormModalRect} = useFormModal({name: "image", positionType: "absolute", buttonText: "insert", inputsProps: imageFormInputsProps, submissionAction: imageFormSubmissionAction, ...formModalCommonProps})
    const askNewImageAttributes: AskAttributes = (modifyNewNodes, positionCaretOnNewNode) => {
      updateLinkFormSubmissionAction((href) =>  {
        modifyNewNodes(href)
        positionCaretOnNewNode()
      })
      setLinkFormModalVisible(true, getOptionFormModalPosition(getLinkFormModalRect().height))
    } */

   /*  useEffect(() => {
      window.modifyImageElement = (img: HTMLImageElement) => {
        const divParent = img.parentElement as HTMLDivElement
        updateInsertOrModifyImage(({dataUrl, name, extension, height, width}) => {
            //img.id = id
            img.src = dataUrl
            img.height = height
            img.width = width
            img.dataset.name = name
            img.dataset.extension = extension
            //divParent.style.paddingLeft = left + "px"
          }
        )
        updateRemoveImage(() => {
          (img.parentElement as HTMLDivElement).remove()
        })

        const {top, left} = img.getBoundingClientRect()
        setImageFormModalVisible(
          true,
          {top: `${top}px`, left: `${left}px`},
          {imageData: {
            dataUrl: img.src,
              name: img.dataset.name as string,
              extension: img.dataset.extension as string,
           },
           height: img.height,
           width: img.width,
           remove: false}
        )
      }
    }, [])
    const [insertOrModifyImage, setInsertOrModifyImage] = useState<InsertOrModifyImage>(() => {})
    const updateInsertOrModifyImage = (fn: InsertOrModifyImage) => {
      setInsertOrModifyImage(() => fn)
    }
    const [removeImage, setRemoveImage] = useState<RemoveImage>(() => {})
    const updateRemoveImage = (fn: RemoveImage) => {
      setRemoveImage(() => fn)
    } */
    const getOptionClassesNames = (className?: string) =>  getColorClassName(selectedColor) + (className ? " " + className : "")

    const getFormModalPosition = (formModalHeight: number): ModalPosition => {
      const rangeTop = document.getSelection()?.getRangeAt(0).getBoundingClientRect().top
      const {top, left, height} = getHtmlEditorModalRect()
      const {top: containerTop, left: containerLeft} = getContainerRect()
      return {top: `${top - containerTop + (((rangeTop ?? 0) > top) ? -formModalHeight-5 : height + 5)}px`, left: `${left - containerLeft}px`}
    }
    const setVisibleOnSelectionTrue = () => {setVisibleOnSelection(true)}
    const {linkOption, linkFormModal} = useLinkOption({className: getOptionClassesNames(linkClassName), getFormModalPosition, setHtmlEditorVisibleTrue: setVisibleOnSelectionTrue})
    const {imageOption, imageFormModal} = useImageOption({getFormModalPosition, setHtmlEditorVisibleTrue: setVisibleOnSelectionTrue})

    const [syntheticCaretStates, setSyntheticCaretStates] = useState({visible: false, top: 0, left: 0, height: 0, width: 0})
    
    const sibling = <>
                    {colorsModal}
                    {elementIdFormModal}
                    {linkFormModal}
                    {imageFormModal}
                    {/* <SyntheticCaret {...syntheticCaretStates}/> */}
                    </>
    
    //const idOffClass = "idOff"
    //const idOnClass = "idOn"

    const children = <Container>
                     <Row>
                     <ColorOption backgroundColor={selectedColor} onClick={onClickSelectedColorOptionHandler}/>
                     </Row>
                     <Row>
                     <Option getNewOptionNode={(t) => createText(t)} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setVisibleOnSelectionTrue} className={getOptionClassesNames()}>
                     T
                     </Option>
                     {spanClassesNames.map((className) => {
                      const classesNames = getOptionClassesNames(className)
                      return  <Option getNewOptionNode={(t) => createSpan({innerHTML: t, className: classesNames})} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setVisibleOnSelectionTrue} className={classesNames}>
                              S
                              </Option>
                     }
                     )}
                     {linkOption}
                     {imageOption}
                     {/* <span className={getOptionClassName()} css={optionCss} onClick={(e) => {handleClickPalletOption("defaultText", undefined)}}>
                     a
                     </span>
                     {spanClassesNames.map((spanClassName, index) =>
                        <span className={getOptionClassName(spanClassName)} css={optionCss} onClick={(e) => {handleClickPalletOption("span", getOptionClassName(spanClassName))}}>
                        a
                        </span>
                     )}
                     <a className={getOptionClassName(linkClassName)} css={optionCss} onClick={(e) => {handleClickPalletOption("link", getOptionClassName(linkClassName))}}>
                     Link
                     </a>
                     <FcPicture size={30} onClick={(e) => {handleClickPalletOption("image", undefined)}} style={{cursor: "pointer"}}/> */}
                     {/* {optionSeparator}
                     <span className={getOptionClass(elementId ? idOnClass : idOffClass)} onMouseDown={handleMouseDown} onClick={handleClickElementId}>
                     ID
                     </span> */}
                     </Row>
                     </Container>

    const {setHtmlEditorModalVisible, getHtmlEditorModalRect, ...restReturn} = useModal({name: "htmlEditor", children, sibling, positionType: "absolute", onMouseDownHandler: (e) => {e.preventDefault()}, ...modalProps, ...modalCommonProps})
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
              if (selection.isCollapsed) {
                setSyntheticCaretStates({visible: true, top: rangeRelativeTop, left: rangeRelativeLeft, height: rangeBottom - rangeTop, width: 3})
              }
              if (isColorsModalVisible()) {
                setColorsModalVisible(true, {top: `${top + height + 5}px`, left: `${left}px`})
              }
              setHtmlEditorModalVisible(true, {top: `${top}px`, left: `${left}px`})
            }
          })
        } else {
        }
    }
    
    return {
      setHtmlEditorModalVisible: setVisibleOnSelection,
      getHtmlEditorModalRect,
      ...restReturn,
    }
}
const modalCommonProps = {draggable: false, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false, /* onMouseDownHandler: (e: React.MouseEvent) => {e.preventDefault()} */}
export const formModalCommonProps = {positionType: "absolute", showLoadingBars: false, ...modalCommonProps} as const

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
const ColorOption = styled.div<{backgroundColor: string}>`
  background-color: ${({backgroundColor}) => backgroundColor};
  width: 20px;
  height: 20px;
  cursor: pointer;
`
/* const optionCss = css`
  font-size: 25px;
  cursor: pointer;
` */