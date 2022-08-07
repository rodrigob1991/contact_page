import styled from "@emotion/styled"
import {isEmptyString} from "../utils/StringFunctions"
import {
    createSpan, createTextNode,
    getTexts,
    hasSiblingOrParentSibling,
    isDiv, isHtmlElement,
    isSpan,
    isText,
    lookUpDivParent,
    removeNodesFromOneSide
} from "../utils/DomManipulations"

type Props = {
    show: boolean
}

export const Pallet =({show}: Props)=> {
    const palletOptionClassName = "palletOption"
    const blackTextClassName = "blackText"
    const underlinedClassName = "underlinedText"

    const positionateCaretOn = (node: Node) => {
        const range = document.createRange()
        const sel = window.getSelection() as Selection
        range.setStart(node, 1)

        sel.removeAllRanges()
        sel.addRange(range)
    }
    const handleCollapsedSelection = (className: string, anchor: Node, anchorOffSet: number) => {
        const anchorParent = anchor.parentElement as HTMLElement
        const anchorValue = anchor.nodeValue
        const anchorLength = anchorValue?.length

    const span = createSpan("&nbsp", className)
        switch (true) {
            case isHtmlElement(anchor):
                anchor.appendChild(span)
                break
            case isText(anchor) && isDiv(anchorParent) && anchorOffSet === 0:
                anchorParent.insertAdjacentElement("afterbegin", span)
                break
            case isText(anchor) && isDiv(anchorParent) && anchorOffSet === anchorLength:
                anchorParent.insertAdjacentElement("beforeend", span)
                break
            case isText(anchor) && isSpan(anchorParent) && anchorOffSet === 0:
                anchorParent.insertAdjacentElement("beforebegin", span)
                break
            case isText(anchor) && isSpan(anchorParent) && anchorOffSet === anchorLength:
                anchorParent.insertAdjacentElement("afterend", span)
                break
            case isText(anchor) && anchorOffSet !== anchorLength:
                const leftNewTextNode = createTextNode((anchorValue as string).substring(0, anchorOffSet))
                const rightNewTextNode = createTextNode((anchorValue as string).substring(anchorOffSet))
                anchorParent.replaceChildren(leftNewTextNode, span, rightNewTextNode)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }

    const handleRangeSelection = (className: string, range: Range) => {
        const copySelectedFragment = range.cloneContents()

        // it seem that range.startContainer is always a text node
        const rangeStartText = range.startContainer as Text
        const startOffSet = range.startOffset
        const startSelectedFragment = copySelectedFragment.firstChild
        const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
        // this is when the selection start over part of a div
        if (startSelectedFragmentIsDiv && (startOffSet > 0 || hasSiblingOrParentSibling(rangeStartText, "left", (p) => isDiv(p)))) {
            const rangeStartTextParent = rangeStartText.parentElement as HTMLElement
            const rangeStartTextDivParent = lookUpDivParent(rangeStartText)

            const newStyledSpan = createSpan(getTexts(startSelectedFragment), className)
            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (startOffSet > 0) {
                const remainSameStyleText = createTextNode((rangeStartText.nodeValue as string).substring(0, startOffSet))
                rangeStartTextParent.replaceChild(remainSameStyleText, rangeStartText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeStartText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom, "right", removeNodeToRemoveFrom, (p) => isDiv(p))
            rangeStartTextDivParent.appendChild(newStyledSpan)

            copySelectedFragment.removeChild(startSelectedFragment)

            range.setStartAfter(rangeStartTextDivParent)
        }

        const rangeEndText = range.endContainer as Text
        const endOffSet = range.endOffset
        const isRangeEndTextAllSelected = endOffSet === rangeEndText.length
        const endSelectedFragment = copySelectedFragment.lastChild
        const endSelectedFragmentIsDiv = endSelectedFragment && isDiv(endSelectedFragment)
        // this is when the selection end over part of a div
        if (endSelectedFragmentIsDiv && (!isRangeEndTextAllSelected || hasSiblingOrParentSibling(rangeEndText, "right", (p)=> isDiv(p)))) {
            const rangeEndTextParent = rangeEndText.parentElement as HTMLElement
            const rangeEndTextDivParent = lookUpDivParent(rangeEndText)

            const newStyledSpan = createSpan(getTexts(endSelectedFragment), className)
            let nodeToRemoveFrom
            let removeNodeToRemoveFrom
            if (!isRangeEndTextAllSelected) {
                const remainSameStyleText = createTextNode((rangeEndText.nodeValue as string).substring(endOffSet))
                rangeEndTextParent.replaceChild(remainSameStyleText, rangeEndText)
                nodeToRemoveFrom = remainSameStyleText
                removeNodeToRemoveFrom = false
            } else {
                nodeToRemoveFrom = rangeEndText
                removeNodeToRemoveFrom = true
            }
            removeNodesFromOneSide(nodeToRemoveFrom,"left", removeNodeToRemoveFrom, (p)=> isDiv(p))
            rangeEndTextDivParent.insertBefore(newStyledSpan, rangeEndTextDivParent.firstChild)

            copySelectedFragment.removeChild(endSelectedFragment)

            range.setEndBefore(rangeEndTextDivParent)
        }

        let spanText = ""
        for (const node of copySelectedFragment.childNodes) {
            if (isText(node) || isSpan(node)) {
                spanText += getTexts(node)
            } else if (node instanceof HTMLDivElement) {
                node.replaceChildren(createSpan(getTexts(node), className))
            } else {
                throw new Error("should no enter in this else")
            }
        }
        if (!isEmptyString(spanText)) {
            copySelectedFragment.replaceChildren(createSpan(spanText, className))
        }
        range.deleteContents()
        range.insertNode(copySelectedFragment)

    }
    const handleStyleSelection = (className: string) => {
            //const newElement = "<span class=" + className + ">&nbsp</span>"
            /*const span = new HTMLSpanElement()
            span.className = className
            span.append("&nbsp")

            switch (true) {
                case anchorIsElement:
                    anchorNode.appendChild(span)
                    break
                case anchorIsText && anchorParentIsDiv && anchorOffSet === 0:
                    anchorParent.insertAdjacentElement("afterbegin", span)
                    break
                case anchorIsText && anchorParentIsDiv && anchorOffSet === anchorLength:
                    anchorParent.insertAdjacentElement("beforeend", span)
                    break
                case anchorIsText && anchorParentIsSpan && anchorOffSet === 0:
                    anchorParent.insertAdjacentElement("beforebegin", span)
                    break
                case anchorIsText && anchorParentIsSpan && anchorOffSet === anchorLength:
                    anchorParent.insertAdjacentElement("afterend", span)
                    break
                case anchorIsText && anchorOffSet !== anchorLength:
                    const anchorText = anchorNode.nodeValue as string
                    const leftNewTextNode = new Text(anchorText.substring(0, anchorOffSet))
                    const rightNewTextNode = new Text(anchorText.substring(anchorOffSet))
                    anchorParent.replaceChildren(leftNewTextNode, span, rightNewTextNode)
                    break
                default:
                    throw new Error("Could not enter in any case, maybe other cases have to be added")
            }*/
        const selection = window.getSelection() as Selection

        if (selection.isCollapsed) {
            handleCollapsedSelection(className, selection.anchorNode as Node, selection.anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(className, selection.getRangeAt(i))
            }
        }
    }
    return (
        <Container show={show}>
            <span className={palletOptionClassName + " " + blackTextClassName}
                  onMouseDown={(e=> e.preventDefault())}
                  onClick={(e) => handleStyleSelection(blackTextClassName)}> A </span>
            <span style={{color: "#000000"}}> - </span>
            <span className={palletOptionClassName + " " + underlinedClassName}
                  onMouseDown={(e=> e.preventDefault())}
                  onClick={(e) => handleStyleSelection(underlinedClassName)}> A </span>
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
