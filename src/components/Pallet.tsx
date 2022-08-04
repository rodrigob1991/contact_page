import styled from "@emotion/styled"

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
    const getTexts = (node: Node) => {
        let texts = ""
        if (node instanceof Text) {
            texts += node.nodeValue || ""
        } else {
            for (const child of node.childNodes) {
                texts += getTexts(child)
            }
        }
        return texts
    }
    const isDiv = (node: Node) => {
        return node instanceof HTMLDivElement
    }
    const isSpan = (node: Node) => {
        return node instanceof HTMLSpanElement
    }
    const hasSibling = (node: Node, side: "right" | "left") => {
        let foundDiv = false
        let foundSibling = false
        let actualNode = node
        const nextOrPreviousSibling = side === "right" ? "nextSibling" : "previousSibling"

        while (!foundDiv && !foundSibling) {
            foundSibling = actualNode[nextOrPreviousSibling] !== null
            const parent = actualNode.parentNode as Node
            foundDiv = isDiv(parent)
            actualNode = parent
        }
        return foundSibling
    }
    const getDivParent = (lookDivParentFrom: Text) => {
        let parent = lookDivParentFrom.parentNode as HTMLElement
        while (true) {
            if (isDiv(parent)) {
                return parent as HTMLDivElement
            }
            parent = parent.parentNode as HTMLElement
        }
    }

    // remove left nodes until the parent is a div
    const removeNodes = (fromNode: ChildNode, side: "right" | "left", includeFromNode: boolean) => {
        let parent = fromNode.parentNode as ParentNode
        const nextOrPreviousSibling = side === "right" ? "nextSibling" : "previousSibling"
        let sibling: ChildNode | null = includeFromNode ? fromNode : fromNode[nextOrPreviousSibling]
        let isParentDiv = isDiv(parent)

        do {
            while (sibling) {
                const currentSibling = sibling
                sibling = currentSibling[nextOrPreviousSibling]
                currentSibling.remove()
            }
            sibling = parent[nextOrPreviousSibling]
            isParentDiv = isDiv(parent)
            parent = parent.parentNode as ParentNode
        } while (!isParentDiv)
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

            const selectedFragment = range.cloneContents()
           // console.table(selectedFragment)
           /* console.table(range.startContainer)
            console.table(range.startContainer.parentElement)
            console.log(range.startContainer === anchorNode)*/
            let newFragment = ""

            // for now it seem that range.startContainer is always a text node
            const rangeStartText = range.startContainer as Text
            const startOffSet = range.startOffset
            const startSelectedFragment = selectedFragment.firstChild
            const startSelectedFragmentIsDiv = startSelectedFragment && isDiv(startSelectedFragment)
            // this is when the selection start over part of a div
            /*if (startSelectedFragmentIsDiv && (startOffSet > 0 || hasSibling(rangeStartText, "left"))) {
                const rangeStartTextParent = rangeStartText.parentElement as HTMLElement
                const rangeStartTextDivParent = getDivParent(rangeStartText)

                const newStyledSpan = createSpan(getTexts(startSelectedFragment))
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
                removeNodes(nodeToRemoveFrom, "right", removeNodeToRemoveFrom)
                rangeStartTextDivParent.appendChild(newStyledSpan)

                // <div> some text </div>
                // <div> <span>some text</span> some other text </div>
                // <div> <span>text</span> text <span>text</span> </div>
                // <div><span>text<span>text</span></span>text</div>
            }*/

            const rangeEndText = range.endContainer as Text
            const endOffSet = range.endOffset
            const isRangeEndTextAllSelected = endOffSet === rangeEndText.length
            const endSelectedFragment = selectedFragment.lastChild
            const endSelectedFragmentIsDiv = endSelectedFragment && isDiv(endSelectedFragment)
            // this is when the selection end over part of a div
            if (endSelectedFragmentIsDiv && (!isRangeEndTextAllSelected || hasSibling(rangeEndText, "right") )) {
               /* const remainSameStyleText = createTextNode((range.endContainer.nodeValue as string).substring(range.endOffset))
                const newStyledSpan = createSpan(getTexts(endSelectedFragment))
                range.endContainer.parentElement?.replaceChildren( newStyledSpan, remainSameStyleText)*/
                const rangeEndTextParent = rangeEndText.parentElement as HTMLElement
                const rangeEndTextDivParent = getDivParent(rangeEndText)

                const newStyledSpan = createSpan(getTexts(endSelectedFragment))
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
                removeNodes(nodeToRemoveFrom,"left", removeNodeToRemoveFrom)
                rangeEndTextDivParent.insertBefore(newStyledSpan, rangeEndTextDivParent.firstChild)
            }

          /*  let spanText = ""
            for (const node of selectedFragment.childNodes) {
                const type = node.nodeType
                const isText = type === 3
                const isSpan = type === 1 && (node as Element).tagName.toLowerCase() === "span"
                const isDiv = type === 1 && (node as Element).tagName.toLowerCase() === "div"

                switch (true) {
                    case isText:
                        spanText += node.nodeValue
                        break
                    case isSpan:
                        spanText += getTexts(node as HTMLSpanElement)
                        break
                    case isDiv:
                        if (!isEmptyString(spanText)) {
                            newFragment += createSpan(spanText)
                            spanText = ""
                        }
                        newFragment += `<div>${createSpan(getTexts(node as Element))}</div>`
                        break
                }
            }
            if (!isEmptyString(spanText)) {
                newFragment += createSpan(spanText)
            }
            newFragment += lastSpan

            range.deleteContents()
            range.insertNode(range.createContextualFragment(newFragment))*/
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
const TeS = styled.span`
color: #778899;
`
