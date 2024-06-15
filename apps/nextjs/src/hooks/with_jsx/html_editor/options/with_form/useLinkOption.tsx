import { createAnchor } from "../../../../../utils/domManipulations"
import Option, { ShowFormModal } from "../Option"
import { ModifyInputsPropsOptionNode, UseOptionWithForm } from "./types"

const inputsProps = {
  href: {type: "textInput" as const, props: {placeholder: "url"}},
}
type InputsProps = typeof inputsProps
type AttributesToAsk = {href: string}

const getModifyInputsProps = (attr: AttributesToAsk) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsPropsOptionNode<HTMLAnchorElement, InputsProps>
  modifyInputsProps.href.props.value = attr.href
  return modifyInputsProps
}

type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({className, setupFormModal, ...rest}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, AttributesToAsk> = (modifyNewLinks, finish) => {
    setupFormModal<HTMLAnchorElement, AttributesToAsk>(inputsProps, modifyNewLinks, finish)
  }

  const onclick = (e: MouseEvent) => {
    const anchor = e.target as HTMLAnchorElement
    const {href} = anchor
    window.modifyElement<HTMLAnchorElement, AttributesToAsk>(anchor, getModifyInputsProps({href}))
  }
  const getNewAnchor = (t: string) => createAnchor({innerHTML: t, className, onclick})

  const linkOption = <Option className={className} getNewOptionNode={getNewAnchor} collapsedSelectionText={"new link"} withText insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                     Link
                     </Option>

  return {linkOption}
}

export default useLinkOption
