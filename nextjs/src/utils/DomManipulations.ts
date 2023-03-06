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
export const isImage = (node: Node) => {
    return node instanceof HTMLImageElement
}
export const positionCaretOn = (node: Node) => {
    const selection = document.getSelection()
    if (selection) {
        let offset = 0
        switch (node.nodeType) {
            case 3:
                offset = (node.nodeValue as string).length
                break
            case 1:
                offset = node.childNodes.length
                break
        }
        selection.collapse(node, offset)
    }
}

export const createText = (text: string) => document.createTextNode(text)

// this type contains the methods that must not be set. I did not found a way to get rid of methods types.
// compiler cannot differencing between methods and function field

type StylesProps = Partial<ExtractWritableProps<CSSStyleDeclaration>>
type DivProps = Partial<ExtractWritableProps<HTMLDivElement>>
export const createDiv = ({props, styles}: {props?: DivProps, styles?: StylesProps}) => {
    const d = document.createElement("div")
    if (props) {
        for (const [k, v] of Object.entries(props)) {
            // @ts-ignore
            d[k] = v
        }
    }
    if (styles) {
        for (const [k, v] of Object.entries(styles)) {
            // @ts-ignore
            d.style[k] = v
        }
    }
    return d
}
type SpanProps = Partial<ExtractWritableProps<HTMLSpanElement>>
export const createSpan = (props?: SpanProps) => {
    const s = document.createElement("span")
    if (props) {
        for (const [k, v] of Object.entries(props)) {
            // @ts-ignore
            s[k] = v
        }
    }
    return s
}
type AnchorProps = Partial<ExtractWritableProps<HTMLAnchorElement>>
export const createAnchor = (props?: AnchorProps) => {
    const a = document.createElement("a")
    if (props) {
        for (const [k, v] of Object.entries(props)) {
            // @ts-ignore
            a[k] = v
        }
    }
    return a
}
type ImageProps = Partial<ExtractWritableProps<HTMLImageElement>>
export const createImage = (props?: ImageProps) => {
    const img = document.createElement("img")
    if (props) {
        for (const [k, v] of Object.entries(props)) {
            // @ts-ignore
            img[k] = v
        }
    }
    return img
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
export const getNextSiblingOrParentSibling = (node: Node, side: "right" | "left", seekTill?: TillParent) => {
    const siblingPropertyKey = side === "right" ? "nextSibling" : "previousSibling"
    let currentNode = node
    let sibling
    let continueSeeking = true

    while (continueSeeking) {
        sibling = currentNode[siblingPropertyKey]
        if (sibling) {
            continueSeeking = false
        } else {
            const parent = currentNode.parentNode
            if (parent) {
                continueSeeking = seekTill ? !seekTill(parent) : true
                currentNode = parent
            } else {
                continueSeeking = false
            }
        }
    }
    return sibling
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
