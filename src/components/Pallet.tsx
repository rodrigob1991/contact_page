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

type Props = {
    show: boolean
    fontSize: number
}
type OptionTargetNode = Text | HTMLSpanElement | HTMLAnchorElement
type GetOptionTargetNode = (text: string)=> OptionTargetNode

export const Pallet =({show, fontSize}: Props)=> {
    const handleCollapsedSelection = (getNewNode: GetOptionTargetNode, anchor: ChildNode, anchorOffSet: number) => {
        const newNode = getNewNode("-")

        const anchorParent = anchor.parentElement as HTMLDivElement | HTMLSpanElement
        const anchorValue = anchor.nodeValue
        const anchorLength = anchorValue?.length

        const isDefaultStyle = newNode instanceof Text
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
            console.log(0)
            // do nothing.
        } else if (isTextStart) {
            console.log(1)
            anchor.before(newNode)
        } else if (isInsideText) {
            console.log(2)
            const text = anchorValue as string
            const leftText = createText(text.substring(0, anchorOffSet))
            const rightText = createText(text.substring(anchorOffSet))
            anchor.after(leftText, newNode, rightText)
            anchor.remove()
        } else if (isTextEnd) {
            console.log(3)
            anchor.after(newNode)
        } else if (isTextStartInSpanOrAnchor) {
            console.log(4)
            anchorParent.before(newNode)
        } else if (isInsideTextInSpanOrAnchor) {
            console.log(5)
            const text = anchorValue as string
            const leftSpanOrAnchor = anchorParent.cloneNode()
            leftSpanOrAnchor.appendChild(createText(text.substring(0, anchorOffSet)))
            const rightSpanOrAnchor = anchorParent.cloneNode()
            rightSpanOrAnchor.appendChild(createText(text.substring(anchorOffSet)))
            anchorParent.after(leftSpanOrAnchor, newNode, rightSpanOrAnchor)
            anchorParent.remove()
        } else if (isTextEndInSpanOrAnchor) {
            console.log(6)
            anchorParent.after(newNode)
        } else {
            throw new Error("Could not enter in any case, maybe other cases have to be added")
        }

        setLastNodeAdded(newNode)
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
            const newNode = getNewNode(texts)

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
            const newNode = getNewNode(texts)

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
            setLastNodeAdded(newNode)
        }

        if (!startSelectedFragmentIsDiv) {
            const texts = getTexts(copySelectedFragment)
            if (!isEmpty(texts)) {
                const children = []
                const newNode = getNewNode(texts)
                children[1] = newNode
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
                setLastNodeAdded(newNode)
            }
        } else {
            copySelectedFragment.childNodes.forEach((n) => {
                if (n instanceof HTMLDivElement) {
                    const newNode = getNewNode(getTexts(n))
                    n.replaceChildren(newNode)
                    if (!modifyEndRange) {
                        setLastNodeAdded(n)
                    }
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
        switch (true) {
            case isDefaultText:
                getNewNode = (t: string) => createText(t)
                break
            case isLink:
                getNewNode = (t: string) => createAnchor(t, className, "")

                const rectRange =  selection.getRangeAt(0).getBoundingClientRect()
                setAskHRefProps({show: true, topPosition: rectRange.top - fontSize, leftPosition: rectRange.left})
                break
            case isSpan:
                getNewNode = (t: string) => createSpan(t, className)
                break
            default:
                throw new Error("class name must fall in some case")
        }

        if (selection.isCollapsed) {
            handleCollapsedSelection(getNewNode, selection.anchorNode as ChildNode, selection.anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(getNewNode, selection.getRangeAt(i))
            }
        }

        if (isLink) {
            setTimeout(()=> refToAskHRefInput.current?.focus(), 100)
        } else {
            positionCaretOnLastNodeAdded()
        }
    }

    const [hRef, setHRef] = useState("")
    const askHRefPropsInit = {show: false, topPosition: 0, leftPosition: 0}
    const [askHRefProps, setAskHRefProps] = useState(askHRefPropsInit)
    const handleCloseAskHRef = () => {
        setAskHRefProps(askHRefPropsInit)
        positionCaretOnLastNodeAdded()
    }

    const refToLastNodeAdded = useRef<OptionTargetNode>()
    const getLastNodeAdded = () => refToLastNodeAdded.current
    const setLastNodeAdded = (n: OptionTargetNode) => refToLastNodeAdded.current = n
    const positionCaretOnLastNodeAdded = () => {
        const lastNodeAdded = getLastNodeAdded()
        if (lastNodeAdded) {
            positionCaretOn(lastNodeAdded)
        }
    }

    const refToAskHRefInput = useRef<HTMLInputElement | null>(null)

    const palletOptionClass = "palletOption"
    const textClasses = ["","blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
    const linkClass = "linkOption"
    const formOptionClass = (className: string) =>  palletOptionClass + " " + className

    const styleOptionSeparator = <span style={{color: "#000000"}}>-</span>

    const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
    }

    return (
        <Container show={show || askHRefProps.show}>
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
               onClick={()=> handleClickPalletOption(linkClass)}>
                Link
            </a>
            <AskHRef {...askHRefProps}>
                <TextInput placeholder={"href"}
                           ref={refToAskHRefInput}
                           width={150}
                           setValue={(v) => setHRef(v)}
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
