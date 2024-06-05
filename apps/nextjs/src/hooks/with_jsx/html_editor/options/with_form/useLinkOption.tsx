import { createAnchor } from "../../../../../utils/domManipulations"
import Option, { ShowFormModal } from "../Option"
import { UseOptionWithForm } from "./types"

const inputsProps = {
  href: {type: "textInput", props: {placeholder: "url"}}
} as const
type AttributesToAsk = {href: string}

type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({className, setupFormModal, setHtmlEditorVisibleTrue}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, AttributesToAsk> = (modifyNewLinks, finish) => {
    setupFormModal<HTMLAnchorElement, AttributesToAsk>(inputsProps, modifyNewLinks, finish)
  }

  const getNewAnchor = (t: string) => createAnchor({innerHTML: t, className, onclick: (e) => {window.modifyElement<HTMLAnchorElement, {href: string}>(e.target as HTMLAnchorElement, inputsProps)}})

  const linkOption = <Option className={className} getNewOptionNode={getNewAnchor} collapsedSelectionText={"new link"} withText insertInNewLine={false} showFormModal={showFormModal} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue}>
                     Link
                     </Option>

  return {linkOption}
}

export default useLinkOption
