import { useEffect, useState } from "react"
import { GetRect } from "../../../../types/dom"
import { createSpan, createText } from "../../../../utils/domManipulations"
import useFormModal, { SubmissionAction, UseFormModalProps } from "../../forms/useFormModal"
import { ModalPosition } from "../../useModal"
import { modalCommonProps } from "../useHtmlEditor"
import Option, { OptionNode, OptionProps, SetHtmlEditorVisibleTrue, ShowFormModal } from "./Option"
import { InputsPropsOptionNodeAttributes, SetupFormModal } from "./with_form/types"
import useImageOption from "./with_form/useImageOption"
import useLinkOption from "./with_form/useLinkOption"

declare global {
  interface Window {
      modifyElement: <E extends HTMLElement, EA extends Partial<E>>(element: E, inputsProps: InputsPropsOptionNodeAttributes<E, EA>) => void
  }
}

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"] as const
/* type DefaultSpanClassName = (typeof defaultSpanClassesNames)[number]
type UseDefaultSpanClassesNames = {[K in DefaultSpanClassName]: boolean} */
const defaultLinkClassName = "linkOption"

type ExtensionOptionProps<WT extends boolean, ON extends OptionNode, ONA extends Partial<ON> | undefined> = 
  Omit<OptionProps<WT, ON, ONA>, "setHtmlEditorVisibleTrue" | "showFormModal"> 
  & ONA extends ON ? {inputsProps: InputsPropsOptionNodeAttributes<ON, Exclude<ONA, undefined>>} : {}
type ExtensionOptionPropsArray<ONA extends OptionNode[], ONAA extends Partial<ONA>[], WTA extends boolean[], R extends ExtensionOptionProps<boolean, OptionNode, {}>[]=[]> = {

}

type MapOptionNodeTo<ONA extends OptionNode[], TO extends "attr" | "wt", R extends (Partial<ONA> | undefined | boolean)[]=[]> = ONA extends [infer ON, ...infer Rest] ? [TO extends "attr" ? Partial<ON> : boolean, ...(Rest extends [] ? MapOptionNodeTo<Rest, TO>: [])] : R

type Props<ONA extends OptionNode[], ONAA extends MapOptionNodeTo<ONA, "attr">, WTA extends MapOptionNodeTo<ONA, "wt">>= {
    spanClassesNames?: string[]
    linkClassName?: string
    getClassesNames: (className?: string) => string
    getContainerRect: GetRect
    getHtmlEditorModalRect: GetRect
    setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
} & ONA extends OptionNode[] ? {extensionsOptionsProps: ExtensionOptionPropsArray<ONA, ONAA, WTA>} : {}

export default function useOptions({spanClassesNames=[], linkClassName=defaultLinkClassName, extensionOptionsProps=[], getClassesNames, getContainerRect, getHtmlEditorModalRect, setHtmlEditorVisibleTrue}: Props) {
    const [formModalPropsRest, setFormModalPropsRest] = useState<Pick<UseFormModalProps, "inputsProps" | "submissionAction" | "buttonText">>({buttonText: "", inputsProps: {}, submissionAction: () => {}})
    const {setFormModalVisible, formModal, getFormModalRect, containsFormModalNode} = useFormModal({showLoadingBars: false, ...formModalPropsRest, ...modalCommonProps})
    const setupFormModal: SetupFormModal = (inputsProps, modifyNewNodes, finish) => {
        const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
            setFormModalVisible(false)
            modifyNewNodes(values)
            finish()
        } 
        setFormModalPropsRest({inputsProps, submissionAction})
        setFormModalVisible(true, getFormModalPosition(getFormModalRect().height))
    }
    const getFormModalPosition = (formModalHeight: number): ModalPosition => {
      const rangeTop = document.getSelection()?.getRangeAt(0).getBoundingClientRect().top
      const {top, left, height} = getHtmlEditorModalRect()
      const {top: containerTop, left: containerLeft} = getContainerRect()
      return {top: `${top - containerTop + (((rangeTop ?? 0) > top) ? -formModalHeight-5 : height + 5)}px`, left: `${left - containerLeft}px`}
    }
    useEffect(() => {
      window.modifyElement = (element, inputsProps) => {
        const modifyNewNodes = (attr: Partial<typeof element>) => {
          Object.assign(element, attr)
        }
        const finish = () => {}
        setupFormModal(inputsProps, modifyNewNodes, finish)
        // const { top, left } = element.getBoundingClientRect()
        // setFormModalVisible(true, {top:`${top}px`, left:`${left}px`})
      }
    }, [])

    const {linkOption} = useLinkOption({className: getClassesNames(linkClassName), setupFormModal, setHtmlEditorVisibleTrue})
    const {imageOption} = useImageOption({setupFormModal, setHtmlEditorVisibleTrue})

    const options = <>
           <Option getNewOptionNode={(t) => createText(t)} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={getClassesNames()}>
            T
           </Option>
           {[...defaultSpanClassesNames,, ...spanClassesNames].map((className) => {
            const classesNames = getClassesNames(className)
            return  <Option getNewOptionNode={(t) => createSpan({innerHTML: t, className: classesNames})} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={classesNames}>
                    S
                    </Option>
            }
            )}
           {linkOption}
           {imageOption}
           {extensionOptionsProps.map(({className, inputsProps, ...extensionOptionsPropsRest}) => {
            const optionPropsRest = {...extensionOptionsPropsRest}
            if (inputsProps) {
              const showFormModal: ShowFormModal<, > = (modifyNewLinks, finish) => {
                setupFormModal<HTMLAnchorElement, AttributesToAsk>(inputsProps, modifyNewLinks, finish)
              }
              Object.assign(optionPropsRest, {showFormModal})
            }

            return  <Option  setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={getClassesNames(className)} {...optionPropsRest}>
                    S
                    </Option>
            }
           )}
           </>

           return {options, formModal}
}