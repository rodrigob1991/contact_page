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
            let newFragment = ""

            const startSelectedFragment = selectedFragment.firstChild
            const startOffSet = range.startOffset
            const startSelectedFragmentIsDiv = startSelectedFragment && startSelectedFragment.nodeType === 1 && (startSelectedFragment as Element).tagName.toLowerCase() === "div"
            // this is when the selection start over part of a div
            if (startSelectedFragmentIsDiv && startOffSet > 0) {
                const startContainer = range.startContainer
                const startContainerParent = startContainer.parentElement as HTMLElement
                console.table(startContainer)
                console.table(startContainerParent)
                

               /* const remainSameStyleText = createTextNode((startContainer.nodeValue as string).substring(0, startOffSet))
                const newStyledSpan = createSpan(getTexts(startSelectedFragment))
                startContainerParent.replaceChild(remainSameStyleText, startContainer)
                startContainerParent.appendChild(newStyledSpan)*/
            }

           /* const endSelectedFragment = selectedFragment.lastChild
            const endSelectedFragmentIsDiv = endSelectedFragment && (endSelectedFragment as Element).tagName.toLowerCase() === "div"
            // this is when the selection end over part of a div
            if (endSelectedFragmentIsDiv && range.endOffset > 0) {
                const remainSameStyleText = createTextNode((range.endContainer.nodeValue as string).substring(range.endOffset))
                const newStyledSpan = createSpan(getTexts(endSelectedFragment))
                range.endContainer.parentElement?.replaceChildren( newStyledSpan, remainSameStyleText)
            }*/

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
