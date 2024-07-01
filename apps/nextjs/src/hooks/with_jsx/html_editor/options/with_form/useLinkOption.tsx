import { createAnchor } from "../../../../../utils/domManipulations"
import { InputsValues } from "../../../forms/useFormModal"
import Option, { ShowFormModal } from "../Option"
import { ModifiableOptionData, ModifyInputsProps, UseOptionWithForm } from "./types"

const type = "link"

const inputsProps = [
  {type: "textInput" as const, props: {placeholder: "url"}}
] as const

type InputsProps = typeof inputsProps
type ModifiableAttributes = {href: string}
export type ModifiableLinkData = ModifiableOptionData<HTMLAnchorElement, ModifiableAttributes, InputsProps>

const getModifyInputsProps = (link: HTMLAnchorElement) => {
  const modifyInputsProps = structuredClone(inputsProps) as unknown as ModifyInputsProps<InputsProps>
  modifyInputsProps[0]["props"] = {...inputsProps[0].props, value: link.href}
  return modifyInputsProps 
}

const mapInputsValuesToAttrs = ([href=""]: InputsValues<InputsProps>) => ({href})

type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<HTMLAnchorElement, ModifiableAttributes, InputsProps, Props> = function({className, setupFormModal, ...rest}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, ModifiableAttributes> = (modifyNewLinks, finish) => {
    setupFormModal<InputsProps>(inputsProps, (inputsValues) => {modifyNewLinks(mapInputsValuesToAttrs(inputsValues))}, finish)
  }
/* 
  const onclick = (e: MouseEvent) => {
    const anchor = e.target as HTMLAnchorElement
    const {href} = anchor
    window.modifyElement<HTMLAnchorElement, AnchorElementValues>(anchor, getModifyInputsProps({href}))
  } */
  const getNewLink = (t: string) => createAnchor({ innerHTML: t, className})

  const option = <Option type={type} className={className} getNewOptionNode={getNewLink} collapsedSelectionText={"new link"} withText insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                  Link
                 </Option>

  return {type, getModifyInputsProps, mapInputsValuesToAttrs, option}
}

export default useLinkOption
