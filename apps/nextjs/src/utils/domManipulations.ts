import {ExtractWritableProps} from "utils/src/types"

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
        selection.removeAllRanges()
        selection.setPosition(node, node instanceof  Text ? node.length : node.childNodes.length)
    }
}

export const createText = (text: string) => document.createTextNode(text)

// this type contains the methods that must not be set. I did not found a way to get rid of methods types.
// compiler cannot differencing between methods and function field

type StylesProps = Partial<ExtractWritableProps<CSSStyleDeclaration>>
type DivProps = Partial<ExtractWritableProps<HTMLDivElement>>
type CreateDivArgs = {props?: DivProps, styles?: StylesProps}
export const createDiv = (args?: CreateDivArgs) => {
    const div = document.createElement("div")
    if (args) {
        if ("props" in args)
            Object.assign(div, args.props)
        if ("styles" in args)
            Object.assign(div, args.styles)
    }
    /* if (props) {
        Object.assign(div, {props})
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
    } */
    return div
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
export const getRelativeRect = (rect: DOMRect, relativeToRect: DOMRect): DOMRect => 
 ({
   get x(){return rect.x - relativeToRect.x},
   get y(){return rect.y - relativeToRect.y},
   get bottom(){return this.top + rect.height},
   get top(){return rect.top - relativeToRect.top },
   get left(){return rect.left - relativeToRect.left},
   get right(){return this.left + rect.width},
   get height(){return rect.height},
   get width(){return rect.width},
   toJSON(){ rect.toJSON() }
 })
 export const getRelativeMousePosition = (mousePosition: {x: number, y: number}, relativeToRect: DOMRect) => 
 ({
   get x() {return mousePosition.x - relativeToRect.x},
   get y() {return mousePosition.y - relativeToRect.y}
 })
 


