import { createAnchor } from "../../../../../utils/domManipulations"
import { InputsValues } from "../../../forms/useFormModal"
import Option, { ShowFormModal } from "../Option"
import { ModifiableOptionData, ModifyInputsProps, UseOptionWithForm } from "./types"

const type = "a" 

const inputsProps = [
  {type: "textInput" as const, props: {placeholder: "url"}}
] as const

type InputsProps = typeof inputsProps
type ModifiableAttributes = {href: string}
export type ModifiableAnchorData = ModifiableOptionData<HTMLAnchorElement, ModifiableAttributes, InputsProps>

const getModifyInputsProps = (anchor: HTMLAnchorElement) => {
  const modifyInputsProps = structuredClone(inputsProps) as unknown as ModifyInputsProps<InputsProps>
  modifyInputsProps[0]["props"] = {...inputsProps[0].props, value: anchor.href}
  return modifyInputsProps 
}

const mapInputsValuesToAttrs = ([href=""]: InputsValues<InputsProps>) => ({href})

type Props = {
  className: string
}
const useAnchorOption: UseOptionWithForm<HTMLAnchorElement, ModifiableAttributes, InputsProps, Props> = function({className, setupFormModal, ...optionPropsRest}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, ModifiableAttributes> = (updateDOM) => {
    setupFormModal<InputsProps>(inputsProps, (inputsValues) => {updateDOM(mapInputsValuesToAttrs(inputsValues))})
  }

  const optionProps = {
    type,
    className,
    getNewOptionNode: (t: string) => createAnchor({innerHTML: t, className}),
    withText: true,
    insertInNewLine: false,
    showFormModal,
    insertNodesBeforeShowFormModal: true,
    ...optionPropsRest
  }

  const option = <Option {...optionProps}>
                  Anchor
                 </Option>

  return {type, getModifyInputsProps, mapInputsValuesToAttrs, option}
}

export default useAnchorOption
