import styled from "@emotion/styled"
import {isEmptyString} from "../utils/StringFunctions"
import {
    createSpan,
    createTextNode,
    getTexts,
    hasSiblingOrParentSibling,
    isDiv,
    isSpan,
    isText,
    lookUpDivParent,
    positionCaretOn,
    removeNodesFromOneSide
} from "../utils/DomManipulations"

type Props = {
    show: boolean
}

export const Pallet =({show}: Props)=> {
    const handleCollapsedSelection = (className: string, anchor: ChildNode, anchorOffSet: number) => {
        const anchorParent = anchor.parentElement as HTMLElement
        const anchorValue = anchor.nodeValue
        const anchorLength = anchorValue?.length

        const isDefaultStyle = isEmptyString(className)
        const isInsideText = isText(anchor) && isDiv(anchorParent) && anchorOffSet !== anchorLength
        const isInsideTextInSpan = isText(anchor) && isSpan(anchorParent) && anchorOffSet !== anchorLength
        const isTextStart = isText(anchor) && isDiv(anchorParent) && anchorOffSet === 0
        const isTextEnd = isText(anchor) && isDiv(anchorParent) && anchorOffSet === anchorLength
        const isTextStartInSpan = isText(anchor) && isSpan(anchorParent) && anchorOffSet === 0
        const isTextEndInSpan = isText(anchor) && isSpan(anchorParent) && anchorOffSet === anchorLength

        const span = createSpan("-", className)

        switch (true) {
            case isDefaultStyle && (isTextStart || isInsideText || isTextEnd):
                // do nothing.
                break
            case isDefaultStyle && isTextStartInSpan:

                break
            case isDefaultStyle && isInsideTextInSpan:

                break
            case isDefaultStyle && isTextEndInSpan:

                break
            case isInsideText || isInsideTextInSpan:
                console.log(6)
                const leftNewTextNode = createTextNode((anchorValue as string).substring(0, anchorOffSet))
                const rightNewTextNode = createTextNode((anchorValue as string).substring(anchorOffSet))
                anchor.after(leftNewTextNode, span, rightNewTextNode)
                anchor.remove()
                break
            case isDiv(anchor):
                console.log(1)
                anchor.appendChild(span)
                break
            case isTextStart:
                console.log(2)
                anchor.before(span)
                break
            case isSpan(anchor) || isTextEnd:
                console.log(3)
                anchor.after(span)
                break
            case isTextStartInSpan:
                console.log(4)
                anchorParent.before(span)
                break
            case isTextEndInSpan:
                console.log(5)
                anchorParent.after(span)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
        positionCaretOn(span)
    }

    const handleRangeSelection = (className: string, range: Range) => {
        let lastSpanToPositionCaret
        const copySelectedFragment = range.cloneContents()

        // it seem that range.startContainer is always a text node
        const rangeStartText = range.startContainer as Text
        const startOffSet = range.startOffset
        const startSelectedFragment = copySelectedFragment.firstChild
        const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
        // this is when the selection start over part of a div
        const modifyStartRange = startSelectedFragmentIsDiv && (startOffSet > 0 || hasSiblingOrParentSibling(rangeStartText, "left", (p) => isDiv(p)))
        if (modifyStartRange) {
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
        const modifyEndRange = endSelectedFragmentIsDiv && (!isRangeEndTextAllSelected || hasSiblingOrParentSibling(rangeEndText, "right", (p)=> isDiv(p)))
        if (modifyEndRange) {
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
            lastSpanToPositionCaret = newStyledSpan
        }

        if (!startSelectedFragmentIsDiv) {
            let spanText = ""
            copySelectedFragment.childNodes.forEach((n) => spanText += getTexts(n))
            if (!isEmptyString(spanText)) {
                const newStyledSpan = createSpan(spanText, className)
                copySelectedFragment.replaceChildren(newStyledSpan)
                lastSpanToPositionCaret = newStyledSpan
            }
        } else {
            copySelectedFragment.childNodes.forEach((n) => {
                if (n instanceof HTMLDivElement) {
                    const newStyledSpan = createSpan(getTexts(n), className)
                    n.replaceChildren(newStyledSpan)
                    if(!modifyEndRange){
                        lastSpanToPositionCaret = n
                    }
                } else {
                    throw new Error("I do not expect a node here not to be a div")
                }
            })
        }
        range.deleteContents()
        range.insertNode(copySelectedFragment)

        if (lastSpanToPositionCaret) {
            positionCaretOn(lastSpanToPositionCaret)
        }
    }
    const handleStyleSelection = (className: string) => {
        const selection = window.getSelection() as Selection

        if (selection.isCollapsed) {
            handleCollapsedSelection(className, selection.anchorNode as ChildNode, selection.anchorOffset)
        } else {
            for (let i = 0; i < selection.rangeCount; i++) {
                handleRangeSelection(className, selection.getRangeAt(i))
            }
        }
    }

    const stylesClasses = ["","blackText", "blackTextUnderline", "redText", "blackTextTitle"]
    const styleOptionSeparator = <span style={{color: "#000000"}}> - </span>

    return (
        <Container show={show}>
            {stylesClasses.map((styleClass, index) =>
                <>
                <span className={"palletOption " + styleClass}
                      onMouseDown={(e => e.preventDefault())}
                      onClick={(e) => handleStyleSelection(styleClass)}> a
                </span>
                    {index < stylesClasses.length - 1 ? styleOptionSeparator : ""}
                </>
            )}
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
