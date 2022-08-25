import styled from "@emotion/styled"
import {isEmpty} from "../utils/StringFunctions"
import {
    createAnchor,
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
import React, {useRef, useState} from "react"
import {TextInput} from "./FormComponents"
import {FcPicture} from "react-icons/all";

type Props = {
    show: boolean
    fontSize: number
}
type OptionTargetElement = HTMLSpanElement | HTMLAnchorElement
type OptionTargetNode = Text | OptionTargetElement
type GetOptionTargetNode = (text: string, isLast: boolean)=> OptionTargetNode

export const Pallet =({show, fontSize}: Props)=> {
    const handleCollapsedSelection = (newNode: OptionTargetNode, anchor: ChildNode, anchorOffSet: number) => {

        const anchorParent = anchor.parentElement as HTMLDivElement | HTMLSpanElement
        const anchorValue = anchor.nodeValue
        const anchorLength = anchorValue?.length

        const isDefaultStyle = isText(newNode)
        const isInside = anchorOffSet !== anchorLength
        const isStart = anchorOffSet === 0
        const isEnd = anchorOffSet === anchorLength
        const isAnchorText = isText(anchor)
        const isAnchorDiv = isDiv(anchor)
        const isAnchorSpan = isSpan(anchor)
        const isAnchorAnchor = isAnchor(anchor)
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

        if (isAnchorDiv || isAnchorSpan || isAnchorAnchor) {
            throw new Error("i do not expect to enter here")
        } else if (isDefaultStyle && (isTextStart || isInsideText || isTextEnd)) {
            // do nothing.
        } else if (isTextStart) {
            anchor.before(newNode)
        } else if (isInsideText) {
            const text = anchorValue as string
            const leftText = createText(text.substring(0, anchorOffSet))
            const rightText = createText(text.substring(anchorOffSet))
            anchor.after(leftText, newNode, rightText)
            anchor.remove()
        } else if (isTextEnd) {
            anchor.after(newNode)
        } else if (isTextStartInSpanOrAnchor) {
            anchorParent.before(newNode)
        } else if (isInsideTextInSpanOrAnchor) {
            const text = anchorValue as string
            const leftSpanOrAnchor = anchorParent.cloneNode()
            leftSpanOrAnchor.appendChild(createText(text.substring(0, anchorOffSet)))
            const rightSpanOrAnchor = anchorParent.cloneNode()
            rightSpanOrAnchor.appendChild(createText(text.substring(anchorOffSet)))
            anchorParent.after(leftSpanOrAnchor, newNode, rightSpanOrAnchor)
            anchorParent.remove()
        } else if (isTextEndInSpanOrAnchor) {
            anchorParent.after(newNode)
        } else {
            throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }

    const handleRangeSelection = (getNewNode: GetOptionTargetNode, range: Range) => {
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

    const handleClickPalletOption = (className: string) => {
        const selection = window.getSelection() as Selection

        const isDefaultText = isEmpty(className)
        const isLink = className === linkClass
        const isSpan = textClasses.includes(className)

        let getNewNode: GetOptionTargetNode
        let defaultTextToPositionCaret: Text | undefined
        const getId = (isLast: boolean) => {
            return isLast ? {id: lastElementAddedId} : {}
        }
        // the id will be set to empty after set caret on node
        const elementProps = {className: className, tabIndex: -1}
        switch (true) {
            case isDefaultText:
                getNewNode = (t) => {
                    const defaultText = createText(t)
                    defaultTextToPositionCaret = defaultText
                    return defaultText
                }
                break
            case isLink:
                getNewNode = (t, isLast) => createAnchor({...getId(isLast), innerHTML: t, ...elementProps})

                const rectRange = selection.getRangeAt(0).getBoundingClientRect()
                setAskHrefProps({show: true, topPosition: rectRange.top - fontSize, leftPosition: rectRange.left})
                break
            case isSpan:
                getNewNode = (t, isLast) => createSpan({...getId(isLast), innerHTML: t, ...elementProps})
                break
            default:
                throw new Error("class name must fall in some case")
        }

        if (selection.isCollapsed) {
            handleCollapsedSelection(getNewNode("-", true), selection.anchorNode as ChildNode, selection.anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(getNewNode, selection.getRangeAt(i))
            }
        }

        if (isLink) {
            setTimeout(() => focusAskHRefInput(), 100)
        } else {
            positionCaretOnLastNodeAdded(defaultTextToPositionCaret)
        }
    }

    const lastElementAddedId = "lastElementAdded"
    const getLastElementAdded = () => document.querySelector("#" + lastElementAddedId) as OptionTargetElement | null

    const [href, setHref] = useState("")
    const askHrefPropsInit = {show: false, topPosition: 0, leftPosition: 0}
    const [askHrefProps, setAskHrefProps] = useState(askHrefPropsInit)
    const handleCloseAskHRef = () => {
        positionCaretOnLastNodeAdded()
        setAskHrefProps(askHrefPropsInit)
    }

    const positionCaretOnLastNodeAdded = (text?: Text) => {
        let lastNodeAdded = text ? text : getLastElementAdded()
        console.table(lastNodeAdded)

        if (lastNodeAdded) {
            positionCaretOn(lastNodeAdded)
            if (lastNodeAdded instanceof HTMLElement) {
                lastNodeAdded.id = ""
                if (lastNodeAdded instanceof HTMLAnchorElement) {
                    lastNodeAdded.href = href
                    setHref("")
                }
            }
        }
    }

    const refToAskHRefInput = useRef<HTMLInputElement | null>(null)
    const focusAskHRefInput = () => refToAskHRefInput.current?.focus()

    const palletOptionClass = "palletOption"
    const textClasses = ["","blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    const linkClass = "linkOption"
    const formOptionClass = (className: string) =>  palletOptionClass + " " + className

    const styleOptionSeparator = <span style={{color: "#000000"}}>-</span>

    const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
    }

    return (
        <Container show={show || askHrefProps.show}>
            {textClasses.map((textClass, index) =>
                <>
                <span className={formOptionClass(textClass)}
                      onMouseDown={handleMouseDown}
                      onClick={(e) => handleClickPalletOption(textClass)}>
                    a
                </span>
                    {styleOptionSeparator}
                </>
            )}
            <a className={formOptionClass(linkClass)}
               onMouseDown={handleMouseDown}
               onClick={(e)=> handleClickPalletOption(linkClass)}>
                Link
            </a>
            {styleOptionSeparator}
            <FcPicture size={25}/>
            <AskHRef {...askHrefProps}>
                <TextInput placeholder={"href"}
                           ref={refToAskHRefInput}
                           width={150}
                           value={href}
                           setValue={(v) => setHref(v)}
                           onEnter={handleCloseAskHRef}/>
            </AskHRef>
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
const AskHRef = styled.div<{ show: boolean, topPosition: number, leftPosition: number }>`
  display: ${({show, topPosition, leftPosition}) => (show ? "flex" : "none") + ";"
    + "top: " + topPosition + "px;"
    + "left: " + leftPosition + "px;"}
  z-index: 1;
  position: absolute;
  border-style: solid;
  border-color: #000000;
`
