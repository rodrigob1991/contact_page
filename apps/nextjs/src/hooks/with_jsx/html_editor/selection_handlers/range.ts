import { isEmpty } from "utils/src/strings"
import { createDiv, createText, getTexts, hasSiblingOrParentSibling, isAnchor, isDiv, isSpan, isText, lookUpDivParent, removeNodesFromOneSide } from "../../../../utils/domManipulations"
import { GetNewOptionNode } from "../options/Option"

export default function rangeSelectionHandler<WT extends boolean>(withText: WT, getNewOptionNode: GetNewOptionNode<WT>, insertInNewLine: boolean, range: Range) {
    const copySelectedFragment = range.cloneContents()

    if (!withText && !insertInNewLine) {
        copySelectedFragment.replaceChildren((getNewOptionNode as GetNewOptionNode<false>)())
    }
    else if (!withText && insertInNewLine) {
        const newLineDiv = createDiv()
        newLineDiv.appendChild((getNewOptionNode as GetNewOptionNode<false>)())
        copySelectedFragment.replaceChildren(newLineDiv)
    }
    else if (withText && insertInNewLine) {
        const newLineDiv = createDiv()
        newLineDiv.appendChild(getNewOptionNode(getTexts(copySelectedFragment)))
        copySelectedFragment.replaceChildren(newLineDiv)
    }
    else { // (withText && !insertInNewLine)
        // it seem that range.startContainer is always a text node
        const rangeStartText = range.startContainer as Text
        const rangeStartTextValue = rangeStartText.nodeValue as string
        const rangeStartTextParent = rangeStartText.parentElement as HTMLElement
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
            const newNode = getNewOptionNode(texts)

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
            range.setStartAfter(rangeStartTextDivParent)
            copySelectedFragment.removeChild(startSelectedFragment)
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
            const newNode = getNewOptionNode(texts)

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
            range.setEndBefore(rangeEndTextDivParent)
            copySelectedFragment.removeChild(endSelectedFragment)
        }
        if (!startSelectedFragmentIsDiv) {
            const texts = getTexts(copySelectedFragment)
            if (!isEmpty(texts)) {
                const children = []
                children.push(getNewOptionNode(texts))
                // this is to avoid getting an span inside other span
                if (copySelectedFragment.childNodes.length === 1 && isText(copySelectedFragment.childNodes[0]) && !isDiv(rangeStartTextParent)) {
                    //&& (isSpan(rangeStartTextParent) || isAnchor(rangeStartTextParent))) {
                    if (firstCharRangeStartTextSelected || lastCharRangeEndTextSelected) {
                        if (firstCharRangeStartTextSelected) {
                            range.setStartBefore(rangeStartTextParent)
                        }
                        if (lastCharRangeEndTextSelected) {
                            range.setEndAfter(rangeStartTextParent)
                        }
                    } else {
                        const leftElement = rangeStartTextParent.cloneNode()
                        leftElement.appendChild(createText(rangeStartTextValue.substring(0, startOffSet)))
                        children.push(leftElement)
                        children.reverse()
                        const rightElement = rangeStartTextParent.cloneNode()
                        rightElement.appendChild(createText(rangeEndTextValue.substring(endOffSet, rangeEndTextValue.length)))
                        children.push(rightElement)

                        range.setStartBefore(rangeStartTextParent)
                        range.setEndAfter(rangeStartTextParent)
                    }
                }
                //copySelectedFragment.replaceChildren(...children.filter((c) => c))
                copySelectedFragment.replaceChildren(...children)
            }
        } else {
            const divs = copySelectedFragment.childNodes
            divs.forEach((n) => {
                if (n instanceof HTMLDivElement) {
                    const newNode = getNewOptionNode(getTexts(n))
                    n.replaceChildren(newNode)
                } else {
                    throw new Error("I do not expect a node here not to be a div")
                }
            })
        }
    }
    range.deleteContents()
    console.table(copySelectedFragment)
    range.insertNode(copySelectedFragment)
}