import { createDiv, createText, isDiv, isHtmlElement, isText, lookUpDivParent } from "../../../../utils/domManipulations"
import { OptionNode } from "../options/Option"

type Args = {
    newNode: OptionNode
    insertInNewLine: boolean
    anchor: ChildNode
    anchorOffSet: number
}

export default function collapsedSelectionHandler({newNode, insertInNewLine, anchor, anchorOffSet}: Args) {
    const anchorParent = anchor.parentElement
    if (anchorParent) {
        const anchorText = anchor.nodeValue ?? ""
        const anchorLength = anchorText.length

        const isInside = anchorOffSet !== anchorLength
        const isStart = anchorOffSet === 0
        const isEnd = anchorOffSet === anchorLength
        const isAnchorText = isText(anchor)
        const isParentDiv = isDiv(anchorParent)
        const isParentHtmlElement = isHtmlElement(anchorParent)
        // const isParentSpan = isSpan(anchorParent)
        // const isParentAnchor = isAnchor(anchorParent)
        // const isParentSpanOrAnchor = isParentSpan || isParentAnchor

        const isTextStartInDiv = isAnchorText && isParentDiv && isStart
        const isInsideTextInDiv = isAnchorText && isParentDiv && isInside
        const isTextEndInDiv = isAnchorText && isParentDiv && isEnd

        // const isTextStartInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isStart
        // const isInsideTextInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isInside
        // const isTextEndInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isEnd

        const isTextStartInHtmlElement = isAnchorText && isParentHtmlElement && isStart
        const isInsideTextInHtmlElement = isAnchorText && isParentHtmlElement && isInside
        const isTextEndInHtmlElement = isAnchorText && isParentHtmlElement && isEnd

        switch (true) {
            case (insertInNewLine):
                const divParent = lookUpDivParent(anchor)
                if (!divParent) {
                    throw new Error("must be an div parent always")
                }
                const newLineDiv = createDiv()
                newLineDiv.appendChild(newNode)
                divParent.after(newLineDiv)
                break
            case (!isAnchorText):
                anchor.after(newNode)
                break
            case (isText(newNode) && (isTextStartInDiv || isInsideTextInDiv || isTextEndInDiv)):
                // do nothing.
                break
            case (isTextStartInDiv):
                anchor.before(newNode)
                break
            case (isInsideTextInDiv):
                const leftText = createText(anchorText.substring(0, anchorOffSet))
                const rightText = createText(anchorText.substring(anchorOffSet))
                anchor.after(leftText, newNode, rightText)
                anchor.remove()
                break
            case (isTextEndInDiv):
                anchor.after(newNode)
                break
            case (isTextStartInHtmlElement):
                anchorParent.before(newNode)
                break
            case (isInsideTextInHtmlElement):
                const leftHtmlElement = anchorParent.cloneNode()
                leftHtmlElement.appendChild(createText(anchorText.substring(0, anchorOffSet)))
                const rightHtmlElement = anchorParent.cloneNode()
                rightHtmlElement.appendChild(createText(anchorText.substring(anchorOffSet)))
                anchorParent.after(leftHtmlElement, newNode, rightHtmlElement)
                anchorParent.remove()
                break
            case (isTextEndInHtmlElement):
                anchorParent.after(newNode)
                break
            default:
                throw new Error("Could not enter in any case, maybe other cases have to be added")
        }
    }
}