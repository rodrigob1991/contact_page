import styled from "@emotion/styled"
import ReactDOM from "react-dom"

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
    const createSpan = (className: string) => {
        const selection = (window.getSelection()as Selection)
        const anchorNode = selection.anchorNode as Node
        const anchorParent = anchorNode?.parentElement as Element
        const anchorOffSet = selection.anchorOffset
        const anchorLength = anchorNode.nodeValue?.length
        const anchorType = anchorNode.nodeType

        const anchorIsText = anchorType === 3
        const anchorIsElement = anchorType === 1
        const anchorParentIsSpan = anchorParent.tagName.toLowerCase() === "span"
        const anchorParentIsDiv = anchorParent.tagName.toLowerCase() === "div"

        if(selection.isCollapsed){
            //const newElement = "<span class=" + className + ">&nbsp</span>"
            const span = new HTMLSpanElement()
            span.className = className
            span.append("&nbsp")

            switch (true) {
                // is an element
                case anchorIsElement:
                    anchorNode.appendChild(span)
                    break
                // is text and caret is at the beginning
                case anchorIsText && anchorParentIsDiv && anchorOffSet === 0:
                    anchorParent.insertAdjacentElement("afterbegin", span)
                    break
                // is text and caret is at the end
                case anchorIsText && anchorParentIsDiv && anchorOffSet === anchorLength:
                    anchorParent.insertAdjacentElement("beforeend", span)


            }

        }else{

        }

        console.log(`anchorNode: ${anchorNode} . element: ${anchorParent}. collapsed: ${selection.isCollapsed}
        . anchorOffSet: ${selection.anchorOffset}. anchorLength: ${anchorLength}`)
       /* if (element) {
            element.insertAdjacentHTML("beforeend", "<span class=" + className + ">&nbsp</span>")
            positionateCaretOn(element.children.item(element.children.length - 1) as HTMLSpanElement)
        }*/
    }
    return (
        <Container show={show}>
            <span className={palletOptionClassName + " " + blackTextClassName}
                  onMouseDown={(e=> e.preventDefault())}
                  onClick={(e) => createSpan(blackTextClassName)}> A </span>
            <span style={{color: "#000000"}}> - </span>
            <span className={palletOptionClassName + " " + underlinedClassName}
                  onMouseDown={(e=> e.preventDefault())}
                  onClick={(e) => createSpan(underlinedClassName)}> A </span>
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
