import { css } from "@emotion/css"
import styled from "@emotion/styled"
import { MouseEventHandler, useEffect, useState } from "react"
import { FcPicture } from "react-icons/fc"
import { isEmpty } from "utils/src/strings"
import { ChangePropertyType } from "utils/src/types"
import { EventsHandlers } from "../../components/ResizableDraggableDiv"
import { ImageData } from "../../components/forms/ImageSelector"
import { GetRect } from "../../types/dom"
import { createAnchor, createDiv, createImage, createSpan, createText, getTexts, hasSiblingOrParentSibling, isAnchor, isDiv, isSpan, isText, lookUpDivParent, positionCaretOn, removeNodesFromOneSide } from "../../utils/domManipulations"
import useFormModal, { SubmissionAction } from "./forms/useFormModal"
import useModal, { ModalPosition, SetVisible, UseModalProps, UseModalReturn } from "./useModal"

const optionsTypesWithForm = {link: "link", image: "image"} as const
type OptionTypeWithForm = keyof typeof optionsTypesWithForm
const isWithForm = (ot: OptionType) : ot is OptionTypeWithForm => ot in optionsTypesWithForm

const optionsTypesWithoutForm = {defaultText: "defaultText", span: "span"} as const
type OptionTypeWithoutForm = keyof typeof optionsTypesWithoutForm
const isWithoutForm = (ot: OptionType) : ot is OptionTypeWithoutForm => ot in optionsTypesWithoutForm

type OptionType = OptionTypeWithForm | OptionTypeWithoutForm
type TargetOptionNode<OT extends OptionType = OptionType> = {defaultText: Text, span: HTMLSpanElement, link: HTMLAnchorElement, image: HTMLDivElement}[OT]

type ElementOptionType = Exclude<OptionType, "defaultText">
type ElementOptionTarget<OT extends ElementOptionType = ElementOptionType> = TargetOptionNode<OT>

type OptionTypeWithoutImage = Exclude<OptionType, "image"> 

type ClassName<OT extends OptionType> = OT extends "span" | "link" ? string : undefined 

type GetTargetOptionNode<OT extends OptionType = OptionType> = ({image: () => HTMLDivElement} &  {[K in OptionTypeWithoutImage] : (text: string, isLast: boolean) => TargetOptionNode<K>})[OT]
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
type Return = ChangePropertyType<UseModalReturn, ["setVisible", SetVisibleOnSelection]>

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
const defaultLinkClassName = "linkOption"
const defaultColors = ["red", "blue", "green", "yellow", "black"]
const defaultGetColorClassName = (color: string) => "color" + color + "Option"

export default function usePallet({getContainerRect, colors=defaultColors, getColorClassName=defaultGetColorClassName, spanClassesNames=defaultSpanClassesNames, linkClassName=defaultLinkClassName, ...modalProps}: Props) : Return {
    const [elementId, setElementId] = useState<string>()
    const consumeElementId = () => {
        const id = elementId
        setElementId(undefined)
        return id
    }
    const [elementIdFormPosition, setElementIdFormPosition] = useState<ModalPosition>({top: "middle", left: "middle"})
    const {setVisible: setVisibleElementIdForm, modal: elementIdForm} = useFormModal({positionType: "absolute", position: elementIdFormPosition, buttonText: "add", inputsProps: {id: {type: "textInput"}}, submissionAction: ({id}) => {setElementId(id)}})
    const handleClickElementId: MouseEventHandler<HTMLSpanElement> = (e) => {
        setElementIdFormPosition({top: `${e.clientY - 20}px`, left: `${e.clientX + 20}px`})
        setVisibleElementIdForm(true)
    }

    const handleCollapsedSelection = (optionType: OptionType, getTargetOptionNode: GetTargetOptionNode, anchor: ChildNode, anchorOffSet: number) => {
        const anchorParent = anchor.parentElement as HTMLElement
        const anchorValue = anchor.nodeValue as string
        const anchorLength = anchorValue.length

        const isInside = anchorOffSet !== anchorLength
        const isStart = anchorOffSet === 0
        const isEnd = anchorOffSet === anchorLength
        const isAnchorText = isText(anchor)
        const isParentDiv = isDiv(anchorParent)
        const isParentSpan = isSpan(anchorParent)
        const isParentAnchor = isAnchor(anchorParent)
        const isParentSpanOrAnchor = isParentSpan || isParentAnchor

        const isTextStart = isAnchorText && isParentDiv && isStart
        const isInsideText = isAnchorText && isParentDiv && isInside
        const isTextEnd = isAnchorText && isParentDiv && isEnd
        const isTextStartInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isStart
        const isInsideTextInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isInside
        const isTextEndInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isEnd

        const targetOptionNode = optionType === "image" ? (getTargetOptionNode as GetTargetOptionNode<"image">)() : getTargetOptionNode("-", true) 

        switch (true) {
            case (!isAnchorText):
                anchor.after(targetOptionNode)
                break
            case (optionType === "defaultText" && (isTextStart || isInsideText || isTextEnd)):
                // do nothing.
                break
            case (optionType === "image"):
                const divParent = lookUpDivParent(anchor)
                if (!divParent) {
                    throw new Error("must be an div parent always")
                }
                divParent.after(targetOptionNode)
                break
            case (isTextStart):
                anchor.before(targetOptionNode)
                break
            case (isInsideText):
                const leftText = createText(anchorValue.substring(0, anchorOffSet))
                const rightText = createText(anchorValue.substring(anchorOffSet))
                anchor.after(leftText, targetOptionNode, rightText)
                anchor.remove()
                break
            case (isTextEnd):
                anchor.after(targetOptionNode)
                break
            case (isTextStartInSpanOrAnchor):
                anchorParent.before(targetOptionNode)
                break
            case (isInsideTextInSpanOrAnchor):
                const leftSpanOrAnchor = anchorParent.cloneNode()
                leftSpanOrAnchor.appendChild(createText(anchorValue.substring(0, anchorOffSet)))
                const rightSpanOrAnchor = anchorParent.cloneNode()
                rightSpanOrAnchor.appendChild(createText(anchorValue.substring(anchorOffSet)))
                anchorParent.after(leftSpanOrAnchor, targetOptionNode, rightSpanOrAnchor)
                anchorParent.remove()
                break
            case (isTextEndInSpanOrAnchor):
                anchorParent.after(targetOptionNode)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }
    const handleRangeSelection = (optionType: OptionTypeWithoutImage, getTargetOptionNode: GetTargetOptionNode<OptionTypeWithoutImage>, range: Range) => {
        const copySelectedFragment = range.cloneContents()

        // it seem that range.startContainer is always a text node
        const rangeStartText = range.startContainer as Text
        const rangeStartTextValue = rangeStartText.nodeValue as string
        const rangeStartTextParent = rangeStartText.parentElement as HTMLDivElement | HTMLSpanElement
        const startOffSet = range.startOffset
        const firstCharRangeStartTextSelected = startOffSet === 0
        const startSelectedFragment = copySelectedFragment.firstChild
        const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
        const modifyStartRange = startSelectedFragmentIsDiv && (!firstCharRangeStartTextSelected || hasSiblingOrParentSibling(rangeStartText, "left", (p) => isDiv(p)))
        if (modifyStartRange) {
            const rangeStartTextDivParent = lookUpDivParent(rangeStartText)
            if (!rangeStartTextDivParent) {
                throw new Error("range start must have a div parent up the hierarchy")
            }

            const texts = getTexts(startSelectedFragment)
            const newNode = getTargetOptionNode(texts, false)

            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (!firstCharRangeStartTextSelected) {
                const remainSameStyleText = createText((rangeStartTextValue).substring(0, startOffSet))
                rangeStartTextParent.replaceChild(remainSameStyleText, rangeStartText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeStartText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom, "right", removeNodeToRemoveFrom, (p) => isDiv(p))
            rangeStartTextDivParent.appendChild(newNode)

            copySelectedFragment.removeChild(startSelectedFragment)

            range.setStartAfter(rangeStartTextDivParent)
        }

        const rangeEndText = range.endContainer as Text
        const rangeEndTextValue = rangeEndText.nodeValue as string
        const rangeEndTextParent = rangeEndText.parentElement as HTMLSpanElement | HTMLDivElement
        const endOffSet = range.endOffset
        const lastCharRangeEndTextSelected = endOffSet === rangeEndText.length
        const endSelectedFragment = copySelectedFragment.lastChild
        const endSelectedFragmentIsDiv = endSelectedFragment && isDiv(endSelectedFragment)
        // this is when the selection end over part of a div
        const modifyEndRange = endSelectedFragmentIsDiv && (!lastCharRangeEndTextSelected || hasSiblingOrParentSibling(rangeEndText, "right", (p)=> isDiv(p)))
        if (modifyEndRange) {
            const rangeEndTextDivParent = lookUpDivParent(rangeEndText)
            if (!rangeEndTextDivParent) {
                throw new Error("range end must have a div parent up the hierarchy")
            }

            const texts = getTexts(endSelectedFragment)
            const newNode = getTargetOptionNode(texts, true)

            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (!lastCharRangeEndTextSelected) {
                const remainSameStyleText = createText((rangeEndTextValue).substring(endOffSet))
                rangeEndTextParent.replaceChild(remainSameStyleText, rangeEndText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeEndText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom,"left", removeNodeToRemoveFrom, (p)=> isDiv(p))
            rangeEndTextDivParent.insertBefore(newNode, rangeEndTextDivParent.firstChild)

            copySelectedFragment.removeChild(endSelectedFragment)

            range.setEndBefore(rangeEndTextDivParent)
        }

        if (!startSelectedFragmentIsDiv) {
            const texts = getTexts(copySelectedFragment)
            if (!isEmpty(texts)) {
                const children = []
                children[1] = getTargetOptionNode(texts, true)
                // this is to avoid getting an span inside other span
                if (copySelectedFragment.childNodes.length === 1
                    && isText(copySelectedFragment.childNodes[0])
                    && (isSpan(rangeStartTextParent) || isAnchor(rangeStartTextParent))) {
                    if (firstCharRangeStartTextSelected || lastCharRangeEndTextSelected) {
                        if (firstCharRangeStartTextSelected) {
                            range.setStartBefore(rangeStartTextParent)
                        }
                        if (lastCharRangeEndTextSelected) {
                            range.setEndAfter(rangeStartTextParent)
                        }
                    } else {
                        const leftSpanOrAnchor = rangeStartTextParent.cloneNode()
                        leftSpanOrAnchor.appendChild(createText(rangeStartTextValue.substring(0, startOffSet)))
                        children[0] = leftSpanOrAnchor
                        const rightSpanOrAnchor = rangeStartTextParent.cloneNode()
                        rightSpanOrAnchor.appendChild(createText(rangeEndTextValue.substring(endOffSet, rangeEndTextValue.length)))
                        children[2] = rightSpanOrAnchor

                        range.setStartBefore(rangeStartTextParent)
                        range.setEndAfter(rangeStartTextParent)
                    }
                }
                copySelectedFragment.replaceChildren(...children.filter((c) => c))
            }
        } else {
            const divs = copySelectedFragment.childNodes
            divs.forEach((n,i) => {
                if (n instanceof HTMLDivElement) {
                    const newNode = getTargetOptionNode(getTexts(n), !modifyEndRange && (i + 1 === divs.length))
                    n.replaceChildren(newNode)
                } else {
                    throw new Error("I do not expect a node here not to be a div")
                }
            })
        }
        range.deleteContents()
        range.insertNode(copySelectedFragment)
    }

    const getCommonElementOptionAttr = () => ({tabIndex: -1, id: consumeElementId()})

    const handleClickOptionWithForm = (optionType: OptionTypeWithForm, handleSelection: HandleSelection, selectionRectTop: number, selectionRectLeft: number) => {
      let setVisible: SetVisible

      switch (optionType) {
        case "link":
          let lastLinkAdded: HTMLAnchorElement
            updateInsertLink((hRef) => {
              const getTargetOptionLink: GetTargetOptionNode<"link"> = (t, isLast) => {
                const link = createAnchor({innerHTML: t, ...getCommonElementOptionAttr()})
                link.href = hRef
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
          setVisible = setVisibleLinkForm
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
          setVisible = setVisibleImageForm
          break
      }

      setVisible(true, {top: `${selectionRectTop}px`, left: `${selectionRectLeft}px`})
    }
    const handleClickOptionWithoutForm = (optionType: OptionTypeWithoutForm, handleSelection: HandleSelection, className: ClassName<OptionTypeWithoutForm>) => {
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
        const selection = window.getSelection()
        if (selection) {
            const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
            const ranges : Range[] = []
            for (let i = 0; i < rangeCount; i++) {
                ranges.push(selection.getRangeAt(i))
            }

            const handleSelection = (getTargetOptionNode: GetTargetOptionNode) => {
                if (isCollapsed) {
                    handleCollapsedSelection(optionType, getTargetOptionNode, anchorNode as ChildNode, anchorOffset)
                } else {
                    if (optionType !== "image") {
                    ranges.forEach((r) => {handleRangeSelection(optionType, getTargetOptionNode, r)})
                    }
                }
            }
            
            if (isWithForm(optionType)) {
                const {y: rectTop,x: rectLeft} = ranges[0].getBoundingClientRect()
                handleClickOptionWithForm(optionType, handleSelection, rectTop, rectLeft)

            } else {
                handleClickOptionWithoutForm(optionType, handleSelection, className)
            }
        }
    }

    const [selectedColor, setSelectedColor] = useState(colors[0])
    const colorsModalChildren = <ColorsModalChildrenContainer columns={Math.ceil(Math.sqrt(colors.length))}>
                                {colors.map(color => 
                                <ColorOption backgroundColor={color} onClick={(e) => {setSelectedColor(color); setVisibleColorsModal(false)}}/>
                                )}
                                </ColorsModalChildrenContainer>
    const {setVisible: setVisibleColorsModal, isVisible: isColorsModalVisible, modal: colorsModal, getRect: getColorsModalRect} = useModal({positionType: "absolute", children: colorsModalChildren, ...formModalCommonProps})
    const onClickSelectedColorOptionHandler: MouseEventHandler = (e) => {
      if (!isColorsModalVisible()) {
        const { top, left } = e.currentTarget.getBoundingClientRect()
        const { top: topContainer, left: leftContainer } = getContainerRect()
        const { height } = getColorsModalRect()
        setVisibleColorsModal(true, {
          top: `${top - topContainer - height}px`,
          left: `${left - leftContainer}px`,
        })
      } else {
        setVisibleColorsModal(false)
      }
    }

    const [insertLink, setInsertLink] = useState<InsertLink>(() => {})
    const updateInsertLink = (fn: InsertLink)=> { setInsertLink(() => fn) }
    const linkFormInputsProps  = {
        href: {type: "textInput"}
    } as const
    const linkFormSubmissionAction: SubmissionAction<typeof linkFormInputsProps>  = ({href}) => {
        insertLink(href)
    }
    const {setVisible: setVisibleLinkForm, modal: linkForm} = useFormModal({positionType: "absolute", buttonText: "insert", inputsProps: linkFormInputsProps, submissionAction: linkFormSubmissionAction, ...formModalCommonProps})

    const imageFormInputsProps  = {
        imageData: {type: "imageSelector"},
        height: {type: "numberInput"},
        width: {type: "numberInput"},
        remove: {type: "checkbox", props: {label: "remove"}}
    } as const
    const imageFormSubmissionAction: SubmissionAction<typeof imageFormInputsProps>  = ({remove, imageData, ...dimensions}) => {
        if (remove){
            removeImage()
        } else {
            insertOrModifyImage({...imageData, ...dimensions})
        }
    }
    const {setVisible: setVisibleImageForm, modal: imageForm} = useFormModal({positionType: "absolute", buttonText: "insert", inputsProps: imageFormInputsProps, submissionAction: imageFormSubmissionAction, ...formModalCommonProps})

    useEffect(() => {
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
        setVisibleImageForm(
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
    }
    
    const sibling = <>
                    {colorsModal}
                    {elementIdForm}
                    {linkForm}
                    {imageForm}
                    </>
    
    //const spanClasses = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    //const linkClass = "linkOption"
    //const idOffClass = "idOff"
    //const idOnClass = "idOn"
    const getOptionClassName = (className?: string) =>  getColorClassName(selectedColor) + (className ? " " + className : "")

    const children = <Container>
                     <Row>
                     <ColorOption backgroundColor={selectedColor} onClick={onClickSelectedColorOptionHandler}/>
                     </Row>
                     <Row>
                     <span className={getOptionClassName() + " " + optionClassName} onClick={(e) => {handleClickPalletOption("defaultText", undefined)}}>
                     a
                     </span>
                     {spanClassesNames.map((spanClassName, index) =>
                        <span className={getOptionClassName(spanClassName) + " " + optionClassName} onClick={(e) => {handleClickPalletOption("span", getOptionClassName(spanClassName))}}>
                        a
                        </span>
                     )}
                     <a className={getOptionClassName(linkClassName) + " " + optionClassName} onClick={(e) => {handleClickPalletOption("link", getOptionClassName(linkClassName))}}>
                     Link
                     </a>
                     <FcPicture size={30} onClick={(e) => {handleClickPalletOption("image", undefined)}} style={{cursor: "pointer"}}/>
                     {/* {optionSeparator}
                     <span className={getOptionClass(elementId ? idOnClass : idOffClass)} onMouseDown={handleMouseDown} onClick={handleClickElementId}>
                     ID
                     </span> */}
                     </Row>
                     </Container>

    const {setVisible, getRect, ...restReturn} = useModal({children, sibling, positionType: "absolute", ...modalProps, ...modalCommonProps})
    const setVisibleOnSelection: SetVisibleOnSelection = (visible, mousePosition) => {
        if (visible) {
            setVisibleColorsModal(false)
            setVisibleImageForm(false)
            setVisibleLinkForm(false)
            // the setTimeout is because when click over an existing range the top of the new range rectangle remain like the older one
            const selection = document.getSelection()
                if (selection) {
                  const {height} = getRect()
                  const {top: containerTop, left: containerLeft} = getContainerRect()
                  const {top: rangeTop, left: rangeLeft, height: rangeHeight} = selection.getRangeAt(0).getBoundingClientRect()
                  let top = rangeTop - containerTop
                  let left = -containerLeft
                  if(mousePosition){
                    top += mousePosition.top > rangeTop + rangeHeight/2 ? rangeHeight + 5 :-(height + 5)
                    left += mousePosition.left
                  }else{
                    top -= height + 5
                    left += rangeLeft
                  }
                  setVisible(true, {top: `${top}px`, left: `${left}px`})
                }
        } else {
            setVisible(false)
        }
    }
    
    return {
      setVisible: setVisibleOnSelection,
      getRect,
      ...restReturn,
    }
}
const modalCommonProps: Partial<UseModalProps<"absolute">> = {draggable: false, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false, onMouseDownHandler: (e) => {e.preventDefault()}}
const formModalCommonProps = {showLoadingBars: false, ...modalCommonProps}

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
const optionClassName = css`
  font-size: 25px;
  cursor: pointer;
`