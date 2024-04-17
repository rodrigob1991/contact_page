import { useState } from "react"
import { createText, createSpan } from "../../../../utils/domManipulations"
import useFormModal from "../../forms/useFormModal"
import Option from "./Option"

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"]
const defaultLinkClassName = "linkOption"

type ExtensionOption = {}

type Props = {
    spanClassesNames?: string[]
    linkClassName?: string
    extensionsOptions?: ExtensionOption[]
    getClassesNames: () => string
}
export default function Options({spanClassesNames, linkClassName, extensionsOptions=[], getClassesNames}: Props) {
    const [formModalPropsRest, setFormModalPropsRest] = useState({buttonText: "", inputsProps: {}, submissionAction: () => {}})
    const {setFormModalVisible, formModal, getFormModalRect, containsFormModalNode} = useFormModal({...formModalPropsRest, showLoadingBars: false, ...modalCommonProps})
  
    const {linkOption} = useLinkOption({className: getOptionClassesNames(linkClassName), getFormModalPosition, setHtmlEditorVisibleTrue: setVisibleOnSelectionTrue})
    const {imageOption, imageFormModal, containsImageFormModalNode} = useImageOption({getFormModalPosition, setHtmlEditorVisibleTrue: setVisibleOnSelectionTrue})

    const askAttributes: AskAttributes = (modifyNewNodes, finish) => {
        const submissionAction: SubmissionAction<typeof linkFormInputsProps> = (values) => {
          setLinkFormModalVisible(false)
          modifyNewNodes(values)
          finish()
        }
        setLinkFormModalPropsRest({inputsProps: linkFormInputsProps, submissionAction})
        setLinkFormModalVisible(true, getFormModalPosition(getLinkFormModalRect().height))
    }

    return <>
           <Option getNewOptionNode={(t) => createText(t)} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setVisibleOnSelectionTrue} className={getOptionClassesNames()}>
            T
           </Option>
           {spanClassesNames.map((className) => {
            const classesNames = getClassesNames(className)
            return  <Option getNewOptionNode={(t) => createSpan({innerHTML: t, className: classesNames})} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setVisibleOnSelectionTrue} className={classesNames}>
                    S
                    </Option>
            }
            )}
           {linkOption}
           {imageOption}
           {extensionsOptions.map((extensionOption) => {
                const classesNames = getClassesNames(className)
                return  <Option getNewOptionNode={(t) => createSpan({innerHTML: t, className: classesNames})} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setVisibleOnSelectionTrue} className={classesNames}>
                        S
                        </Option>
                }
            )}
            </>

}