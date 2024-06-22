import { createAnchor } from "../../../../../utils/domManipulations"
import { InputsValues } from "../../../forms/useFormModal"
import Option, { ShowFormModal } from "../Option"
import { optionAttributeTypePrefix } from "../useOptions"
import { ModifyInputsProps, UseOptionWithForm } from "./types"

const linkOptionType = "link"

const inputsProps = [
  {type: "textInput" as const, props: {placeholder: "url"}}
]
type InputsProps = typeof inputsProps

const getLinkModifyInputsProps = (link: HTMLAnchorElement) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsProps<InputsProps>
  modifyInputsProps[0].props.value = link.href
  return modifyInputsProps
}

const mapLinkInputsValuesToAttrs = ([href=""]: InputsValues<InputsProps>) => ({href})

type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<HTMLAnchorElement, InputsProps, "link", Props> = function({className, setupFormModal, ...rest}) {
  const showFormModal: ShowFormModal<HTMLAnchorElement, {href: string}> = (modifyNewLinks, finish) => {
    setupFormModal<InputsProps>(inputsProps, (inputsValues) => {modifyNewLinks(mapLinkInputsValuesToAttrs(inputsValues))}, finish)
  }
/* 
  const onclick = (e: MouseEvent) => {
    const anchor = e.target as HTMLAnchorElement
    const {href} = anchor
    window.modifyElement<HTMLAnchorElement, AnchorElementValues>(anchor, getModifyInputsProps({href}))
  } */
  const getNewLink = (t: string) => {
    const link = createAnchor({ innerHTML: t, className})
    link.dataset[optionAttributeTypePrefix] = linkOptionType
    return link
  }

  const linkOption = <Option className={className} getNewOptionNode={getNewLink} collapsedSelectionText={"new link"} withText insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                     Link
                     </Option>

  return {linkOptionType, getLinkModifyInputsProps, mapLinkInputsValuesToAttrs, linkOption}
}

export default useLinkOption
