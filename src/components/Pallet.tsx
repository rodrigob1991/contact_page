import styled from "@emotion/styled"
import {isEmptyString} from "../utils/StringFunctions";
import {
    getTexts,
    hasSiblingOrParentSibling,
    isDiv,
    isSpan,
    isText,
    lookUpDivParent,
    removeNodesFromOneSide
} from "../utils/DomManipulation";

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
    const handleStyleSelection = (className: string) => {
        const createTextNode = (text: string) => document.createTextNode(text)
        const createSpan = (text: string) => {
            const span = document.createElement("span")
            span.className = className
            span.appendChild(createTextNode(text))
            return span
        }

        const selection = (window.getSelection()as Selection)
        const anchorNode = selection.anchorNode as Node
        const anchorParent = anchorNode?.parentElement as Element
        const anchorOffSet = selection.anchorOffset
        const anchorLength = anchorNode.nodeValue?.length
        const anchorType = anchorNode.nodeType

        const anchorIsText = anchorType === 3
        const anchorIsElement = anchorType === 1
        const anchorIsDiv = anchorIsElement && (anchorNode as Element).tagName === "div"
        const anchorParentIsSpan = anchorParent.tagName.toLowerCase() === "span"
        const anchorParentIsDiv = anchorParent.tagName.toLowerCase() === "div"

        if (selection.isCollapsed) {
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
        } else {
            // selection.anchorNode = range.startContainer
            const range = selection.getRangeAt(0)

            console.log(`anchorNode: ${anchorNode}
        . anchorParent: ${anchorParent}
        . collapsed: ${selection.isCollapsed}
        . anchorOffSet: ${selection.anchorOffset}
        . anchorLength: ${anchorLength}
        . anchorValue: ${anchorNode.nodeValue}
        . anchorRangesCount: ${selection.rangeCount}
        . endOffSet: ${range.endOffset}
        . endLength: ${range.endContainer.nodeValue?.length}
        . rangeStartOffSet: ${range.startOffset}`)

            const copySelectedFragment = range.cloneContents()

            // it seem that range.startContainer is always a text node
            const rangeStartText = range.startContainer as Text
            const startOffSet = range.startOffset
            const startSelectedFragment = copySelectedFragment.firstChild
            const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
            // this is when the selection start over part of a div
            if (startSelectedFragmentIsDiv && (startOffSet > 0 || hasSiblingOrParentSibling(rangeStartText, "left", (p)=> isDiv(p)))) {
                const rangeStartTextParent = rangeStartText.parentElement as HTMLElement
                const rangeStartTextDivParent = lookUpDivParent(rangeStartText)

                const newStyledSpan = createSpan(getTexts(startSelectedFragment))
                let nodeToRemoveFrom
                let ifRemoveNodeToRemoveFrom
                if (startOffSet > 0) {
                    const remainSameStyleText = createTextNode((rangeStartText.nodeValue as string).substring(0, startOffSet))
                    rangeStartTextParent.replaceChild(remainSameStyleText, rangeStartText)
                    nodeToRemoveFrom = remainSameStyleText
                    ifRemoveNodeToRemoveFrom = false
                } else {
                    nodeToRemoveFrom = rangeStartText
                    ifRemoveNodeToRemoveFrom = true
                }
                removeNodesFromOneSide(nodeToRemoveFrom, "right", ifRemoveNodeToRemoveFrom, (p)=> isDiv(p))
                rangeStartTextDivParent.appendChild(newStyledSpan)

                copySelectedFragment.removeChild(startSelectedFragment)
                range.setStart(range.commonAncestorContainer,1 )
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

                const newStyledSpan = createSpan(getTexts(endSelectedFragment))
                let nodeToRemoveFrom
                let ifRemoveNodeToRemoveFrom
                if (!isRangeEndTextAllSelected) {
                    const remainSameStyleText = createTextNode((rangeEndText.nodeValue as string).substring(endOffSet))
                    rangeEndTextParent.replaceChild(remainSameStyleText, rangeEndText)
                    nodeToRemoveFrom = remainSameStyleText
                    ifRemoveNodeToRemoveFrom = false
                } else {
                    nodeToRemoveFrom = rangeEndText
                    ifRemoveNodeToRemoveFrom = true
                }
                removeNodesFromOneSide(nodeToRemoveFrom,"left", ifRemoveNodeToRemoveFrom, (p)=> isDiv(p))
                rangeEndTextDivParent.insertBefore(newStyledSpan, rangeEndTextDivParent.firstChild)

                copySelectedFragment.removeChild(endSelectedFragment)
                range.setEnd(range.commonAncestorContainer, countChildsSelectedFragment -1)
            }

            let spanText = ""
            for (const node of copySelectedFragment.childNodes) {
                if (isText(node) || isSpan(node)) {
                    spanText += getTexts(node)
                } else if (node instanceof HTMLDivElement) {
                    node.replaceChildren(createSpan(getTexts(node)))
                } else {
                    throw new Error("should no enter in this else")
                }
            }
            if (!isEmptyString(spanText)) {
                copySelectedFragment.replaceChildren(createSpan(spanText))
            }
            range.deleteContents()
            range.insertNode(copySelectedFragment)
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
