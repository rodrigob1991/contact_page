export const normalizeNode = (node: Node) => {
    for (const child in node.childNodes){

    }
}

export const removeNodesFromOneSide = (fromNode: ChildNode, side: "right" | "left", includeFromNode: boolean, removingTill: (parent: ParentNode) => boolean) => {
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
    } while (!stopRemoving)
}
export const hasSibling = (node: Node, side: "right" | "left", seekTill?: (parent: ParentNode) => boolean) => {
    let continueSeeking = true
    let foundSibling = false
    let actualNode = node
    const siblingPropertyKey = side === "right" ? "nextSibling" : "previousSibling"

    while (continueSeeking) {
        const parent = actualNode.parentNode
        if (parent) {
            foundSibling = actualNode[siblingPropertyKey] !== null
            continueSeeking = !foundSibling && (!seekTill || seekTill(parent))
        } else {
            continueSeeking = false
        }
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
