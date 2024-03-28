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
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({getFormModalPosition, setHtmlEditorVisibleTrue}) {
  const [linkFormModalPropsRest, setLinkFormModalPropsRest] = useState({inputsProps: linkFormInputsProps, submissionAction: linkFormModalSubmissionAction})
  const {setLinkFormModalVisible, linkFormModal, getLinkFormModalRect} = useFormModal({name: "link", ...linkFormModalPropsRest, ...formModalCommonProps})
  const askAttributes: AskAttributes = (modifyNewNodes, finish) => {
    const submissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
      modifyNewNodes(values)
      finish()
    }
    setLinkFormModalPropsRest({inputsProps: linkFormInputsProps, submissionAction})
    setLinkFormModalVisible(true, getFormModalPosition(getLinkFormModalRect().height))
  }
  const linkOption = <Option getNewOptionNode={(t) => createAnchor({innerHTML: t})} withText insertInNewLine={false} askAttributes={askAttributes} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue}>
                    Link
                    </Option>

  return {linkOption, linkFormModal}
}

export default useLinkOption
