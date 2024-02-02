import styled from "@emotion/styled"
import { MouseEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { FcPicture } from "react-icons/fc"
import { isEmpty } from "utils/src/strings"
import { DeleteOrRecoverButton } from "../../components/Buttons"
import { NumberInput, TextInput } from "../../components/FormComponents"
import { ContainsNode } from "../../components/ResizableDraggableDiv"
import ImageSelector, { ImageData } from "../../components/forms/ImageSelector"
import { createAnchor, createDiv, createImage, createSpan, createText, getTexts, hasSiblingOrParentSibling, isAnchor, isDiv, isSpan, isText, lookUpDivParent, positionCaretOn, removeNodesFromOneSide } from "../../utils/domManipulations"
import { useRecordState } from "../useRecordState"
import useFormModal, { SubmissionAction } from "./forms/useFormModal"
import { Ask, useAsk } from "./useAsk"
import useModal, { ModalPosition, SetVisible } from "./useModal"

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

type Props = {
    rootElementId: string
}

export default function usePallet({rootElementId}: Props) : [SetVisible, ReactNode, ContainsNode] {
    const getRootElement = () => {
        return document.getElementById(rootElementId)
    }
  /*   const containerDivRef = useRef<HTMLDivElement>(null)
    const getContainerDiv = () => containerDivRef.current as HTMLDivElement
    const [position, setPosition] = useState("absolute")
    const [top, setTop] = useState("none")
    useEffect(() => {
        const options = {
            root: undefined,
            rootMargin: "0px",
            threshold: 1
        }
        const callback: IntersectionObserverCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    const scrollY = window.scrollY
                    const top = getComputedStyle(getContainerDiv()).top
                    const handleScroll = (e: Event) => {
                        if(window.scrollY <= scrollY) {
                            window.removeEventListener("scroll", handleScroll)
                            setPosition("absolute")
                            setTop(top)
                        }
                    }
                    window.addEventListener("scroll", handleScroll)
                    setPosition("fixed")
                    setTop("0px")
                }
                console.log(entry)
            })
        }
        const observer = new IntersectionObserver(callback, options)
        observer.observe(getContainerDiv())
    }, []) */

    //THIS EFFECT IS FOR WHEN IS REMOVE A DIV DELETE THE SPAN THAT THE BROWSER CREATE. I DONT LIKE AT ALL.
   /* useEffect(() => {
        const listener = (e: InputEvent) => {
            if (e.inputType === "deleteContentBackward") {
                const nextToCaretSibling = getNextSiblingOrParentSibling((window.getSelection() as Selection).anchorNode as Node, "right")
                if (nextToCaretSibling && nextToCaretSibling instanceof HTMLSpanElement) {
                    if (isEmpty(nextToCaretSibling.className)) {
                        nextToCaretSibling.parentElement?.append(getTexts(nextToCaretSibling))
                        nextToCaretSibling.remove()
                    }

                }
            }
        }
        const removeListener = () => {
            getRootElement()?.removeEventListener("input", listener)
        }
        if (show) {
            getRootElement()?.addEventListener<"input">("input", listener)
        } else {
            removeListener()
        }
        return removeListener
    }, [show])*/


    const [elementId, setElementId] = useState<string>()
    const consumeElementId = () => {
        const id = elementId
        setElementId(undefined)
        return id
    }
    const [elementIdFormPosition, setElementIdFormPosition] = useState<ModalPosition>({top: "middle", left: "middle"})
    const [setVisibleElementIdForm, elementIdForm] = useFormModal({positionType: "absolute", position: elementIdFormPosition, buttonText: "add", inputsProps: {id: {type: "textInput"}}, submissionAction: ({id}) => {setElementId(id)}})
    //const [askElementId, askElementIdElement] = useAskElementId({id: elementId, setId: setElementId, focusRootElement: focusRootElement})
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
        let lastNode: Node
        switch (optionType) {
            case "defaultText":
                getTargetOptionNode = (t, isLast) => {
                    const defaultText = createText(t)
                    if (isLast) {
                        lastNode = defaultText
                    }
                    return defaultText
                }
                break
            case "span":
                getTargetOptionNode = (t, isLast) => {
                    const span = createSpan({innerHTML: t, className, ...getCommonElementOptionAttr()})
                    if (isLast) {
                        lastNode = span
                    }
                    return span
                }
                break
        }
        handleSelection(getTargetOptionNode)
        setTimeout(() => {positionCaretOn(lastNode)}, 100)
        
    }
    const handleClickPalletOption = <OT extends OptionType>(optionType: OT, className: ClassName<OT>) => {
        const selection = window.getSelection() as Selection
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


    /* const handleClickPalletOption = (optionType: OptionType, className?: string) => {
        const selection = window.getSelection() as Selection
        const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
        const ranges : Range[] = []
        for (let i = 0; i < rangeCount; i++) {
            ranges.push(selection.getRangeAt(i))
        }
        // use to ask href of links and props of images
        const {y: rectTop,x: rectLeft} = ranges[0].getBoundingClientRect()
        let somethingToAsk = false
        let setHandleSelection: (f: (p?: OptionTargetElementProps) => void) => void = () => {}

        let getNewNode : GetOptionTargetNodeWithProps
        let onFinally: () => void

        const elementProps = {className: className, tabIndex: -1, ...(elementId ? {id: consumeElementId()} : {})}

        switch (optionType) {
            case "defaultText":
                let lastDefaultText: Text
                getNewNode = (t, isLast) => {
                    const defaultText = createText(t)
                    if (isLast) {
                        lastDefaultText = defaultText
                    }
                    return defaultText
                }
                onFinally = () => { positionCaretOn(lastDefaultText) }
                break
            case "span":
                let lastSpan: HTMLSpanElement
                getNewNode = (t, isLast) => {
                    const span = createSpan({innerHTML: t, ...elementProps})
                    if (isLast) {
                        lastSpan = span
                    }
                    return span
                }
                onFinally = () => { positionCaretOn(lastSpan) }
                break
            case "link":
                let lastLinkAdded : HTMLAnchorElement
                getNewNode = (t, isLast, hRef) => {
                    const link = createAnchor({innerHTML: t, ...elementProps})
                    //link.id = lastElementAddedId
                    link.href = hRef as string
                    if (isLast) {
                        lastLinkAdded = link
                    }
                    return link
                }
                somethingToAsk = true
                setHandleSelection = (handleSelection) => {
                    updateInsertLink((hRef) => {
                        handleSelection(hRef)
                        setTimeout(()=> {positionCaretOn(lastLinkAdded)}, 100)
                    })
                }

                onFinally = () => {
                    askHRef(rectTop, rectLeft)
                }
                break
            case "image":
                somethingToAsk = true
                setHandleSelection = (handleSelection) => {
                    updateInsertOrModifyImage((ip) => {
                        handleSelection(ip)
                    })
                }
                getNewNode = (t, isLast, ip) => {
                    const {parent, image} = ip as ImageProps
                    const div = createDiv({
                        props: {... elementProps, contentEditable: "false"},
                        styles: {width: "100%", justifyContent: "center", display: "flex"}
                    })
                    const imageElement = createImage(image)
                    imageElement.setAttribute("onclick", `{
                        window.modifyImageElement(this)
                    }`)
                    div.append(imageElement)
                    return div
                }
                onFinally = () => {
                    setVisibleImageForm(true, {top: `${rectTop}px`, left: `${rectLeft}px`})
                    //askImageProps(rectTop, rectLeft)
                }
                break
        }

        const handleSelection = (p?: OptionTargetElementProps) => {
            if (isCollapsed) {
                handleCollapsedSelection(optionType, getNewNode("-", true, p), anchorNode as ChildNode, anchorOffset)
            } else {
                ranges.forEach((r) => {handleRangeSelection(optionType, (text, isLast) => getNewNode(text, isLast, p), r)})
            }
        }
        if (somethingToAsk) {
            setHandleSelection(handleSelection)
        } else {
            handleSelection()
        }
        setTimeout(onFinally, 100)
    }
 */
    const [insertLink, setInsertLink] = useState<InsertLink>(() => {})
    const updateInsertLink = (fn: InsertLink)=> { setInsertLink(() => fn) }
    //const [askHRef, askHRefElement] = useAskHRef({insertLink: insertLink}
    const linkFormInputsProps  = {
        href: {type: "textInput"}
    } as const
    const linkFormSubmissionAction: SubmissionAction<typeof linkFormInputsProps>  = ({href}) => {
        insertLink(href)
    }
    const [setVisibleLinkForm, linkForm] = useFormModal({positionType: "absolute", buttonText: "insert", inputsProps: linkFormInputsProps, submissionAction: linkFormSubmissionAction})


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
    const [setVisibleImageForm, imageForm] = useFormModal({positionType: "absolute", buttonText: "insert", inputsProps: imageFormInputsProps, submissionAction: imageFormSubmissionAction})

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
          { top: `${top}px`, left: `${left}px` },
          {
            imageData: {
              dataUrl: img.src,
              name: img.dataset.name as string,
              extension: img.dataset.extension as string,
            },
            height: img.height,
            width: img.width,
            remove: false
          }
        )
        /* askImageProps(imgRect.top, imgRect.left, {
          image: {
            id: img.id,
            src: img.src,
            height: img.height,
            width: img.width,
          },
          parent: {
            left: parseInt(
              getContainedString(divParent.style.paddingLeft, undefined, "px")
            ),
          },
        }) */
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
   /*  const [askImageProps, askImagePropsElement] = useAskImageProps({
      insertOrModifyImage: insertOrModifyImage,
      removeImage: removeImage,
    })
 */
    const handleMouseDown: MouseEventHandler = (e) => {
        e.preventDefault()
    }

    const palletOptionClass = "palletOption"
    const spanClasses = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    const linkClass = "linkOption"
    const idOffClass = "idOff"
    const idOnClass = "idOn"
    const getOptionClass = (className?: string) =>  className ? palletOptionClass + " " + className : palletOptionClass

    const optionSeparator = <span style={{color: "#000000", fontSize: "2rem"}}>-</span>

    const children = <Container>
                     <span className={getOptionClass()} onMouseDown={handleMouseDown} onClick={(e) => {handleClickPalletOption("defaultText", undefined)}}>
                     a
                     </span>
                     {optionSeparator}
                     {spanClasses.map((spanClass, index) =>
                        <>
                        <span className={getOptionClass(spanClass)} onMouseDown={handleMouseDown} onClick={(e) => {handleClickPalletOption("span", spanClass)}}>
                        a
                        </span>
                        {optionSeparator}
                        </>
                     )}
                     <a className={getOptionClass(linkClass)} onMouseDown={handleMouseDown} onClick={(e) => {handleClickPalletOption("link", linkClass)}}>
                     Link
                     </a>
                     {optionSeparator}
                     <FcPicture onMouseDown={handleMouseDown} size={25} onClick={(e) => {handleClickPalletOption("image", undefined)}} style={{cursor: "pointer"}}/>
                     {optionSeparator}
                     <span className={getOptionClass(elementId ? idOnClass : idOffClass)} onMouseDown={handleMouseDown} onClick={handleClickElementId}>
                     ID
                     </span>
                     {elementIdForm}
                     {linkForm}
                     {imageForm}
                     </Container>

    return useModal({children, draggable: true, resizable: false, visibleHideButton: false, visibleCenterPositionButton: false,  positionType: "hooked", position: {top: "start", left: "end"}})
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-items: center;
  padding: 5px;
  gap: 5px;
  overflow: auto;
  border-radius: 5px;
  background-color: #FFFFFF;
`
/* type UseAskElementIdProps = {
    id: string | undefined
    setId: (id: string)=> void
    focusRootElement: ()=> void
}
const useAskElementId = ({id, setId, focusRootElement}: UseAskElementIdProps): [Ask, JSX.Element] => {
    //const [localId, setLocalId] = useState(id || "")

    const refToInput = useRef<HTMLInputElement | null>(null)
    const focusInput = () => refToInput.current?.focus()

    const handleOnEnter = () => {
        //setId(localId)
        //setLocalId("")
        hide()
        focusRootElement()
    }
    const handleOnEscape = () => {
        setId("")
        hide()
        focusRootElement()
    }

    const [ask, hide, isAsking, askElement] = useAsk({
        child: <TextInput placeholder={"id"}
                          style={{width: "200px", fontSize: "1.8rem"}}
                          ref={refToInput}
                          value={id || ""}
                          setValue={setId}
                          onEnter={handleOnEnter}
                          onEscape={handleOnEscape}  />,
        onShow: focusInput
    })
    return [ask, askElement]
}

type InsertLink = (hRef: string) => void
type UseAskHRefProps = {
    insertLink: InsertLink
}
const useAskHRef = ({insertLink}: UseAskHRefProps): [Ask, JSX.Element] => {
    const [hRef, setHRef] = useState("")

    const refToInput = useRef<HTMLInputElement | null>(null)
    const focusInput = () => refToInput.current?.focus()

    const handleOnEnter = () => {
        insertLink(hRef)
        setHRef("")
        hide()
    }
    const handleOnEscape = () => {
        setHRef("")
        hide()
    }

    const [ask, hide, isAsking, askElement] = useAsk({
        child: <TextInput placeholder={"href"}
                          style={{width: "200px", fontSize: "1.8rem"}}
                          ref={refToInput}
                          value={hRef}
                          setValue={setHRef}
                          onEnter={handleOnEnter}
                          onEscape={handleOnEscape}  />,
        onShow: focusInput
    })
    return [ask, askElement]
}

type UseAskImagePropsProps = {
    insertOrModifyImage: InsertOrModifyImage
    removeImage: RemoveImage
}
const useAskImageProps = ({insertOrModifyImage, removeImage}: UseAskImagePropsProps): [(top: number, left: number, ip?: ImageProps) => void, JSX.Element] => {
    const {state: imageProps, setState: setImageProp, setDefaultState: setImagePropsDefault} = useRecordState({image: {id: "", src: "", height: 0, width: 0}, parent: {left: 0}})
    const {height, width, id, src} = imageProps.image
    const {left} = imageProps.parent

    const [modifying, setModifying] = useState(false)

    const askImageProps = (top: number, left: number, ip?: ImageProps) => {
        if (ip) {
            setModifying(true)
            setImageProp(ip)
        }
        ask(top, left)
    }

    const processImage = (name: string, extension: string, dataUrl: string) => {
        setImageProp({image: {id: name, src: dataUrl}})
    }

    const close = () => {
        setImagePropsDefault()
        setRemove(false)
        setModifying(false)
        hide()
    }
    const handleOnClickAccept: MouseEventHandler<HTMLButtonElement> = (e) => {
        if (remove) {
            removeImage()
        } else {
            insertOrModifyImage(imageProps)
        }
        close()
    }
    const handleOnClickCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
        close()
    }

    const [remove, setRemove] = useState(false)
    const handleRemove = () => {
        setRemove(true)
    }
    const handleRecover = () => {
        setRemove(false)
    }

    const refToHeightInput = useRef<HTMLInputElement>(null)
    const focusHeightInput = ()=> refToHeightInput.current?.focus()

    const getWrapFormOption = (e: JSX.Element) =>
        <div style={{color: "grey", display: "flex", flexDirection: "row", paddingBottom: 2, paddingTop: 2, borderBottomStyle: "solid", borderWidth: "thin",width: "150px"}}>
            {e}
        </div>
    const getFormOptionLabel = (str: string) =>
        <span style={{fontSize: "2rem", width: 70}}>{str}:</span>

    const [ask, hide, isAsking, askElement] = useAsk({
        child:   <div style={{padding: 5}}>
                        {getWrapFormOption(<>
                                           {getFormOptionLabel("height")}
                                           <NumberInput disabled={remove} style={{ width: "60%", fontSize: "1.9rem"}} ref={refToHeightInput} value={height} setValue={(v) => {setImageProp({image:{height: v}})}}/>
                                           </>)
                        }
                        {getWrapFormOption(<>
                                           {getFormOptionLabel("width")}
                                           <NumberInput disabled={remove} style={{ width: "60%", fontSize: "1.9rem"}} value={width} setValue={(v) => {setImageProp({image:{width: v}})}}/>
                                           </>)
                        }
                        {getWrapFormOption(<>
                            {getFormOptionLabel("left")}
                            <NumberInput disabled={remove} style={{ width: "60%", fontSize: "1.9rem"}} value={left} setValue={(v) => {setImageProp({parent:{left: v}})}}/>
                        </>)
                        }
                        {getWrapFormOption(<>
                                           <ImageSelector disabled={remove} processSelectedImage={processImage}
                                               label={getFormOptionLabel("src")} imageMaxSize={10}/>
                                           <span style={{
                                               fontSize: "2rem", display: "inline-block", overflow: "hidden",
                                               textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                               {id}</span>
                                           </>)
                        }
                        {modifying && <div style={{display: "flex", justifyContent: "center", padding: 5}}>
                                      <DeleteOrRecoverButton handleRecover={()=> {handleRecover()}} handleDelete={()=> {handleRemove()}} color={"gray"} size={15}/>
                                      </div>
                        }
                        <div style={{display: "flex"}}>
                            <button style={{width: "50%", fontSize: "1.8rem"}} onClick={handleOnClickAccept}>accept</button>
                            <button style={{width: "50%", fontSize: "1.8rem"}} onClick={handleOnClickCancel}>cancel</button>
                        </div>
                        </div>,
        onShow: focusHeightInput,
        maxWidth: 290
    })
    return [askImageProps, askElement]
} */