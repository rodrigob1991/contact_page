import { createAnchor } from "../../../../../utils/domManipulations"
import { InputTypesProps } from "../../../forms/useFormModal"
import Option, { ShowFormModal } from "../Option"
import { UseOptionWithForm } from "./types"

const inputsProps = {
  href: {type: "textInput" as const, props: {placeholder: "url"}}
}
type InputsProps = typeof inputsProps
type InputsPropsKey = keyof InputsProps

type ModifyInputsProps = {
  [K1 in keyof InputsProps]: {
    [K2 in keyof InputsProps[K1]]: K2 extends "props" ? InputsProps[K1][K2] & {value: InputTypesProps[InputsProps[K1]["type"]]["value"]} : InputsProps[K1][K2]
  }
}
const getModifyInputsProps = (attr: AttributesToAsk) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsProps
  for (const key in modifyInputsProps) {
    modifyInputsProps[key as InputsPropsKey].props.value = attr[key as InputsPropsKey] 
  }
  return modifyInputsProps
}

type AttributesToAsk = {href: string}

type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({className, setupFormModal, ...rest}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, AttributesToAsk> = (modifyNewLinks, finish) => {
    setupFormModal<HTMLAnchorElement, AttributesToAsk>(inputsProps, modifyNewLinks, finish)
  }

  const onclick = (e: MouseEvent) => {
    const anchor = e.target as HTMLAnchorElement
    window.modifyElement<HTMLAnchorElement, AttributesToAsk>(anchor, getModifyInputsProps({href: anchor.href}))
  }
  const getNewAnchor = (t: string) => createAnchor({innerHTML: t, className, onclick})

  const linkOption = <Option className={className} getNewOptionNode={getNewAnchor} collapsedSelectionText={"new link"} withText insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                     Link
                     </Option>

  return {linkOption}
}

export default useLinkOption
