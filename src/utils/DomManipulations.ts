import {ExtractWritableProps} from "./Types"

type TillParent = (parent: ParentNode) => boolean

export const isText = (node: Node) => {
    return node instanceof Text
}
export const isHtmlElement = (node: Node) => {
    return node instanceof HTMLElement
}
export const isDiv = (node: Node) => {
    return node instanceof HTMLDivElement
}
export const isSpan = (node: Node) => {
    return node instanceof HTMLSpanElement
}
export const isAnchor = (node: Node) => {
    return node instanceof HTMLAnchorElement
}
export const positionCaretOn = (node: Node) => {
    const selection = document.getSelection()
    if (selection) {
        selection.selectAllChildren(node)
        selection.collapseToEnd()
    }
}
export const createText = (text: string) => document.createTextNode(text)

type SpanProps = Partial<ExtractWritableProps<HTMLSpanElement>>
export const createSpan = (props: SpanProps) => {
    const s = document.createElement("span")
    for (const [k, v] of Object.entries(props)) {
        // @ts-ignore
        s[k] = v
    }
    return s
}

// this type contains the methods that must not be set. I did not found a way to get rid of methods types.
// compiler cannot differencing between methods and function field
type AnchorProps = Partial<ExtractWritableProps<HTMLAnchorElement>>
export const createAnchor = (props: AnchorProps) => {
    //tabindex = "-1"
    const a = document.createElement("a")
    for (const [k, v] of Object.entries(props)) {
        // @ts-ignore
        a[k] = v
    }
    return a
}
export const removeNodesFromOneSide = (fromNode: ChildNode, side: "right" | "left", includeFromNode: boolean, removingTill: TillParent) => {
    let parent = fromNode.parentNode
    const siblingPropertyKey = side === "right" ? "nextSibling" : "previousSibling"
    let sibling: ChildNode | null = includeFromNode ? fromNode : fromNode[siblingPropertyKey]
    const stopRemoving = () => {
        if (parent && !removingTill(parent)) {
            sibling = parent[siblingPropertyKey]
            parent = parent.parentNode
            return false
        } else {
            return true
        }
    }

    do {
        while (sibling) {
            const currentSibling = sibling
            sibling = currentSibling[siblingPropertyKey]
            currentSibling.remove()
        }
    } while (!stopRemoving())
}
export const hasSiblingOrParentSibling = (node: Node, side: "right" | "left", seekTill?: TillParent) => {
    let continueSeeking = true
    let foundSibling = false
    let actualNode = node
    const siblingPropertyKey = side === "right" ? "nextSibling" : "previousSibling"

    while (continueSeeking) {
        const parent = actualNode.parentNode
        if (parent) {
            foundSibling = actualNode[siblingPropertyKey] !== null
            continueSeeking = !foundSibling && (!seekTill || !seekTill(parent))
            if (continueSeeking) {
                actualNode = parent
            }
        } else {
            continueSeeking = false
        }
    }
    return foundSibling
}
export const lookUpDivParent = (node: Node) => {
    return lookUpParent(node, (p) => isDiv(p)) as null | HTMLDivElement
}
export const lookUpParent = (node: Node, seekTill: TillParent) => {
    let parent = node.parentNode
    while (parent && !seekTill(parent)) {
        parent = parent.parentNode
    }
    return parent
}
export const getTexts = (node: Node) => {
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
export const normalizeNode = (node: Node) => {
    for (const child in node.childNodes){

    }
}
