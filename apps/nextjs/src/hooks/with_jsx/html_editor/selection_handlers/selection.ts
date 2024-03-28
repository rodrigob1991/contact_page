import { OptionType, GetTargetOptionNode } from "../useHtmlEditor"
import collapsedSelectionHandler from "./collapsed"
import rangeSelectionHandler from "./range"

export default function selectionHandler(optionType: OptionType, getTargetOptionNode: GetTargetOptionNode) {
    const selection = document.getSelection()
    if (selection) {
        const {isCollapsed, rangeCount, anchorNode, anchorOffset} = selection
        if (isCollapsed) {
            collapsedSelectionHandler(optionType, getTargetOptionNode, anchorNode as ChildNode, anchorOffset)
        } else {
            for (let i = 0; i < rangeCount; i++) {
                rangeSelectionHandler(optionType, getTargetOptionNode, selection.getRangeAt(i))
            }
        }
    }
}