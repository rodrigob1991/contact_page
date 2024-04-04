import { useState } from "react"
import useFormModal, { SubmissionAction } from "../../../forms/useFormModal"
import { formModalCommonProps } from "../../useHtmlEditor"
import Option, { AskAttributes } from "../Option"
import { UseOptionWithForm } from "./types"
import { createAnchor } from "../../../../../utils/domManipulations"

const linkFormInputsProps = {
  href: {type: "textInput", props: {placeholder: "url"}}
} as const
const linkFormModalSubmissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
}
type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({getFormModalPosition, setHtmlEditorVisibleTrue, className}) {
  const [linkFormModalPropsRest, setLinkFormModalPropsRest] = useState({inputsProps: linkFormInputsProps, submissionAction: linkFormModalSubmissionAction})
  const {setLinkFormModalVisible, linkFormModal, getLinkFormModalRect, containsLinkFormModalNode} = useFormModal({name: "link", ...linkFormModalPropsRest, ...formModalCommonProps})
  const askAttributes: AskAttributes = (modifyNewNodes, finish) => {
    const submissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
      setLinkFormModalVisible(false)
      modifyNewNodes(values)
      finish()
    }
    setLinkFormModalPropsRest({inputsProps: linkFormInputsProps, submissionAction})
    setLinkFormModalVisible(true, getFormModalPosition(getLinkFormModalRect().height))
  }
  const linkOption = <Option className={className} getNewOptionNode={(t) => createAnchor({innerHTML: t, className})} collapsedSelectionText={"new link"} withText insertInNewLine={false} askAttributes={askAttributes} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue}>
                     Link
                     </Option>

  return {linkOption, linkFormModal, containsLinkFormModalNode}
}

export default useLinkOption
