import { createDiv, createText, isAnchor, isDiv, isSpan, isText, lookUpDivParent } from "../../../../utils/domManipulations"
import { OptionNode } from "../options/Option"

export default function collapsedSelectionHandler(newNode: OptionNode, insertInNewLine: boolean, anchor: ChildNode, anchorOffSet: number) {
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

    const isTextStartInDiv = isAnchorText && isParentDiv && isStart
    const isInsideTextInDiv = isAnchorText && isParentDiv && isInside
    const isTextEndInDiv = isAnchorText && isParentDiv && isEnd
    const isTextStartInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isStart
    const isInsideTextInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isInside
    const isTextEndInSpanOrAnchor = isAnchorText && isParentSpanOrAnchor && isEnd

    //const targetOptionNode = optionType === "image" ? (getTargetOptionNode as GetTargetOptionNode<"image">)() : getTargetOptionNode(" new " + optionType, true) 
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
            const leftText = createText(anchorValue.substring(0, anchorOffSet))
            const rightText = createText(anchorValue.substring(anchorOffSet))
            anchor.after(leftText, newNode, rightText)
            anchor.remove()
            break
        case (isTextEndInDiv):
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