import { useState } from "react"
import { createAnchor } from "../../../../../utils/domManipulations"
import Option, { AskAttributes } from "../Option"
import { UseOptionWithForm } from "./types"

const linkFormInputsProps = {
  href: {type: "textInput", props: {placeholder: "url"}}
} as const
/* const linkFormModalSubmissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
} */
type Props = {
  className: string
}
const useLinkOption: UseOptionWithForm<Props, "link"> = function({className, setupFormModal}) {
  //const [linkFormModalPropsRest, setLinkFormModalPropsRest] = useState({inputsProps: linkFormInputsProps, submissionAction: linkFormModalSubmissionAction})
  //const {setLinkFormModalVisible, linkFormModal, getLinkFormModalRect, containsLinkFormModalNode} = useFormModal({name: "link", ...linkFormModalPropsRest, ...formModalCommonProps})
  const askAttributes: AskAttributes<HTMLAnchorElement, {href: string}> = (modifyNewLinks, finish) => {
    /* const submissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
      setLinkFormModalVisible(false)
      modifyNewNodes(values)
      finish()
    } */
    //setLinkFormModalPropsRest({inputsProps: linkFormInputsProps, submissionAction})
    //setLinkFormModalVisible(true, getFormModalPosition(getLinkFormModalRect().height))
    //setFormModalVisibleTrue()
    setupFormModal(linkFormInputsProps, modifyNewLinks, finish)
  }
  const linkOption = <Option className={className} getNewOptionNode={(t) => createAnchor({innerHTML: t, className})} collapsedSelectionText={"new link"} withText insertInNewLine={false} askAttributes={askAttributes} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue}>
                     Link
                     </Option>

  return {linkOption}
}

export default useLinkOption
