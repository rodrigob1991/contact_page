import styled from "@emotion/styled"
import {isEmpty} from "../utils/StringFunctions"
import {
    createAnchor,
    createImage,
    createSpan,
    createText,
    getTexts,
    hasSiblingOrParentSibling,
    isAnchor,
    isDiv,
    isSpan,
    isText,
    lookUpDivParent,
    positionCaretOn,
    removeNodesFromOneSide
} from "../utils/DomManipulations"
import React, {ChangeEvent, useEffect, useRef, useState} from "react"
import {NumberInput, TextInput} from "./FormComponents"
import {FcPicture} from "react-icons/fc"

type Props = {
    show: boolean
    fontSize: number
}
type OptionType = "defaultText" | "span" | "link" | "image"
type OptionTargetElement = HTMLSpanElement | HTMLAnchorElement | HTMLImageElement
type OptionTargetNode = Text | OptionTargetElement
type GetOptionTargetNode = (text: string, isLast: boolean)=> OptionTargetNode

const handleMouseDown = (e: React.MouseEvent<Element>) => {
    e.preventDefault()
}

export const Pallet =({show, fontSize}: Props)=> {
    const lastElementAddedId = "lastElementAdded"
    const getLastElementAdded = () => {
        return document.querySelector("#" + lastElementAddedId) as OptionTargetElement | null
    }

    const handleCollapsedSelection = (optionType: OptionType, newNode: OptionTargetNode, anchor: ChildNode, anchorOffSet: number) => {
        const anchorParent = anchor.parentElement as HTMLDivElement | OptionTargetElement
        const anchorValue = anchor.nodeValue as string
        const anchorLength = anchorValue?.length

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

        switch (true) {
            case (!isAnchorText):
                anchor.after(newNode)
                break
            case (optionType === "defaultText" && (isTextStart || isInsideText || isTextEnd)):
                // do nothing.
                break
            case (isTextStart):
                anchor.before(newNode)
                break
            case (isInsideText):
                const leftText = createText(anchorValue.substring(0, anchorOffSet))
                const rightText = createText(anchorValue.substring(anchorOffSet))
                anchor.after(leftText, newNode, rightText)
                anchor.remove()
                break
            case (isTextEnd):
                anchor.after(newNode)
                break
            case (isTextStartInSpanOrAnchor):
                anchorParent.before(newNode)
                break
            case (isInsideTextInSpanOrAnchor):
                const leftSpanOrAnchor = anchorParent.cloneNode()
                leftSpanOrAnchor.appendChild(createText(anchorValue.substring(0, anchorOffSet)))
                const rightSpanOrAnchor = anchorParent.cloneNode()
                rightSpanOrAnchor.appendChild(createText(anchorValue.substring(anchorOffSet)))
                anchorParent.after(leftSpanOrAnchor, newNode, rightSpanOrAnchor)
                anchorParent.remove()
                break
            case (isTextEndInSpanOrAnchor):
                anchorParent.after(newNode)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }
    const handleRangeSelection = (optionType: OptionType, getNewNode: GetOptionTargetNode, range: Range) => {
        if (optionType === "image") {
            // for now i don't  insert images when select ranges
            return
        }

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
            const newNode = getNewNode(texts, false)

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
            const newNode = getNewNode(texts, true)

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
                children[1] = getNewNode(texts, true)
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
                    const newNode = getNewNode(getTexts(n), !modifyEndRange && (i + 1 === divs.length))
                    n.replaceChildren(newNode)
                } else {
                    throw new Error("I do not expect a node here not to be a div")
                }
            })
        }
        range.deleteContents()
        range.insertNode(copySelectedFragment)
    }

    const handleClickPalletOption = (optionType: OptionType, className?: string) => {
        const selection = window.getSelection() as Selection

        const rectRange = selection.getRangeAt(0).getBoundingClientRect();

        let getNewNode: GetOptionTargetNode
        let onFinally: () => void

        const elementProps = {className: className, tabIndex: -1}

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
                onFinally = () => {
                    positionCaretOn(lastDefaultText)
                }
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
                onFinally = () => {
                    lastSpan.id = ""
                    positionCaretOn(lastSpan)
                }
                break
            case "link":
                askHref(rectRange.top, rectRange.left)
                getNewNode = (t, isLast) => {
                    const link = createAnchor({innerHTML: t, ...elementProps})
                    if (isLast) {
                        link.id = lastElementAddedId
                    }
                    return link
                }
                onFinally = () => {
                    focusAskHRefInput()
                }
                break
            case "image":
                askImageProps(rectRange.top, rectRange.left)
                getNewNode = (t, isLast) => createImage({id: lastElementAddedId, ...elementProps})
                onFinally = () => {
                    //positionCaretOn(image)
                }
                break
        }

        if (selection.isCollapsed) {
            handleCollapsedSelection(optionType, getNewNode("-", true), selection.anchorNode as ChildNode, selection.anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(optionType, getNewNode, selection.getRangeAt(i))
            }
        }
        // to give time to update the DOM
        setTimeout(onFinally, 100)
    }

    const [href, setHref] = useState("")
    const askHrefPropsInit = {show: false, top: 0, left: 0}
    const [askHrefProps, setAskHrefProps] = useState(askHrefPropsInit)
    const handleCloseAskHRef = () => {
        const lastLinkAdded = getLastElementAdded() as HTMLAnchorElement
        positionCaretOn(lastLinkAdded)
        lastLinkAdded.id = ""
        lastLinkAdded.href = href
        setHref("")
        setAskHrefProps(askHrefPropsInit)
    }
    const askHref = (top: number, left: number) => {
        setAskHrefProps({show: true, top: top - fontSize, left: left})
    }
    const refToAskHRefInput = useRef<HTMLInputElement | null>(null)
    const focusAskHRefInput = () => refToAskHRefInput.current?.focus()

    const [showAskImageProps, setShowAskImageProps] = useState(false)
    const [positionAskImageProps, setPositionAskImageProps] = useState({top: 0, left: 0})

    const askImageProps = (top: number, left: number) => {
        setShowAskImageProps(true)
        setPositionAskImageProps({top: top, left: left})
    }

    const refToLastImageSrc = useRef<string>()
    const setLastImageSrc = (src: string) => {
        refToLastImageSrc.current = src
    }

    const onAcceptAskImageProps = (imageDimensions: ImageDimensions) => {
        const lastImageAdded = getLastElementAdded() as HTMLImageElement
        lastImageAdded.src = refToLastImageSrc.current as string
        for (let [key, value] of Object.entries(imageDimensions)) {
            // @ts-ignore
            lastImageAdded[key] = value
        }
        setPositionAskImageProps({top: 0, left: 0})
        setShowAskImageProps(false)
    }

    const palletOptionClass = "palletOption"
    const spanClasses = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    const linkClass = "linkOption"
    const getOptionClass = (className?: string) =>  className ? palletOptionClass + " " + className : palletOptionClass

    const optionSeparator = <span style={{color: "#000000"}}>-</span>

    return (
        <Container show={show || askHrefProps.show || showAskImageProps}>
            <span className={getOptionClass()}
                  onMouseDown={handleMouseDown}
                  onClick={(e) => handleClickPalletOption("defaultText")}>
                a
            </span>
            {optionSeparator}
            {spanClasses.map((spanClass, index) =>
                <>
                <span className={getOptionClass(spanClass)}
                      onMouseDown={handleMouseDown}
                      onClick={(e) => handleClickPalletOption("span", spanClass)}>
                    a
                </span>
                    {optionSeparator}
                </>
            )}
            <a className={getOptionClass(linkClass)}
               onMouseDown={handleMouseDown}
               onClick={(e)=> handleClickPalletOption("link", linkClass)}>
                Link
            </a>
            {optionSeparator}
            <ImagePalletOption handleClickImagePalletOption={() => {handleClickPalletOption("image")}}
                               setLastImageSrc={setLastImageSrc}
                               askImagePropsProps={{
                                   show: showAskImageProps,
                                   position: positionAskImageProps,
                                   onAccept: onAcceptAskImageProps}}/>

            <AskContainer {...askHrefProps}>
                <TextInput placeholder={"href"}
                           ref={refToAskHRefInput}
                           width={150}
                           value={href}
                           setValue={(v) => setHref(v)}
                           onEnter={handleCloseAskHRef}/>
            </AskContainer>
        </Container>
    )
}

const Container = styled.div<{ show: boolean}>`
  display: ${({show}) => (show ? "flex" : "none") + ";"}
  flex-direction: row;
  align-items: center;
  padding: 5px;
  gap: 10px;
  overflow: auto; 
  border-style: solid;
  border-color: #778899;
  background-color: #FFFFFF;
 `
const AskContainer = styled.div<{ show: boolean, top: number, left: number }>`
  display: ${({show, top, left}) => (show ? "flex" : "none") + ";"
    + "top: " + top+ "px;"
    + "left: " + left + "px;"}
  flex-direction: column;
  z-index: 1;
  position: absolute;
  border-style: solid;
  border-color: #000000;
`
type ImagePalletOptionProps = {
    handleClickImagePalletOption: ()=> void
    setLastImageSrc: (src: string)=> void
    askImagePropsProps: AskImagePropsProps
}
const ImagePalletOption = ({handleClickImagePalletOption, setLastImageSrc, askImagePropsProps}: ImagePalletOptionProps) => {
    const inputFileRef = useRef<HTMLInputElement>(null)

    const handleClick = (e: React.MouseEvent<SVGElement>) => {
        handleClickImagePalletOption();
        (inputFileRef.current as HTMLInputElement).click()
    }

    const handleImageSelection = (e: ChangeEvent<HTMLInputElement>) => {
        const image = e.target.files?.item(0)
        if (image) {
            if (image.size / 10 ** 6 > 20) {
            } else {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const imageDataUrl = reader.result as string
                    if (imageDataUrl) {
                        setLastImageSrc(imageDataUrl)
                    }
                }
                reader.readAsDataURL(image)
            }
        }
    }

    return (
        <>
            <input ref={inputFileRef} onChange={handleImageSelection} style={{display: "none"}}
                   type={"file"} accept={"image/*"}/>
            <FcPicture onMouseDown={handleMouseDown} size={25} onClick={handleClick} style={{cursor: "pointer"}}/>
            <AskImageProps {...askImagePropsProps}/>
        </>
    )
}
type AskImagePropsProps = { show: boolean, position: { top: number, left: number }, imageDimensions?: ImageDimensions, onAccept: (im: ImageDimensions) => void }
type ImageDimensions = { height: number, width: number }
const AskImageProps = ({show, onAccept, position: {top, left}, imageDimensions: imageDimensionsInit}: AskImagePropsProps) => {
    const refToHeightInput = useRef<HTMLInputElement | null>(null)
    useEffect(() => {
        if (show) {
            (refToHeightInput.current as HTMLInputElement).focus()
        }
    }, [show])

    const [imageDimensions, setImageDimensions] = useState(imageDimensionsInit || {height: 0, width: 0})
    const setImageDimension = (value: string | number, key: keyof ImageDimensions) => {
        setImageDimensions((id) => {
            const newImageProps = {...id}
            newImageProps[key] = value
            return newImageProps
        })
    }
    const handleOnEnter = () => {
        onAccept(imageDimensions)
    }

    return (
        <AskContainer show={show} top={top} left={left}>
            <NumberInput ref={refToHeightInput} width={100} value={imageDimensions.height}
                         setValue={(v) => setImageDimension(v, "height")} placeholder={"height"}
                         onEnter={handleOnEnter}/>
            <NumberInput width={100} value={imageDimensions.width} setValue={(v) => setImageDimension(v, "width")}
                         placeholder={"width"}
                         onEnter={handleOnEnter}/>
        </AskContainer>
    )
}
