import { ReactNode, useEffect, useState } from "react"
import { GetRect } from "../../../../types/dom"
import { createSpan, createText } from "../../../../utils/domManipulations"
import useFormModal, { SubmissionAction, UseFormModalProps } from "../../forms/useFormModal"
import { ModalPosition } from "../../useModal"
import { modalCommonProps } from "../useHtmlEditor"
import Option, { OptionNode, OptionProps, SetHtmlEditorVisibleTrue, ShowFormModal } from "./Option"
import { InputsPropsOptionNodeAttributes, SetupFormModal } from "./with_form/types"
import useImageOption from "./with_form/useImageOption"
import useLinkOption from "./with_form/useLinkOption"
import { Available, NonEmptyArray } from "utils/src/types"
import { ContainsNode } from "../../../../components/ResizableDraggableDiv"

declare global {
  interface Window {
      modifyElement: <E extends HTMLElement, EA extends Partial<E>>(element: E, inputsProps: InputsPropsOptionNodeAttributes<E, EA>) => void
  }
}

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"] as const
const defaultLinkClassName = "linkOption"

type ExtensionOptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean> = 
  Omit<OptionProps<ON, ONA, WT>, "setHtmlEditorVisibleTrue" | "showFormModal"> 
  & Available<ON, ONA, {inputsProps: InputsPropsOptionNodeAttributes<ON, Exclude<ONA, undefined>>}>

type ExtensionOptionPropsArray<ONS extends OptionNode[], ONAS extends (Partial<ONS[number]> | undefined)[], WTS extends boolean[], R=ExtensionOptionProps<ONS[number], ONAS[number], WTS[number]>[]> = 
  ONS extends [infer ON, ...infer ONSR] ? ONAS extends [infer ONA, ...infer ONASR] ? WTS extends [infer WT, ...infer WTSR] ? WT extends boolean ? ON extends OptionNode ? ONA extends (Partial<ON> | undefined) ?  ONSR extends OptionNode[] ? ONASR extends (Partial<ONSR[number]> | undefined)[] ? WTSR extends boolean[] ? [ExtensionOptionProps<ON, ONA, WT>, ...ExtensionOptionPropsArray<ONSR, ONASR, WTSR>] : never : never : never : never : never : never : R : R : R

export type MapOptionNodeTo<ONS extends OptionNode[], TO extends "attr" | "wt", D extends Partial<ONS[number]> | undefined | boolean= TO extends "attr" ? Partial<ONS[number]> | undefined : boolean> = ONS extends [infer ON, ...infer ONSR] ? [TO extends "attr" ? Omit<D, Exclude<keyof ONSR[number], keyof ON>> | undefined : D , ...(ONSR extends [] ? MapOptionNodeTo<ONSR, TO>: [])] : D[]

export type UseOptionsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, WTS extends MapOptionNodeTo<ONS, "wt">> = {
    spanClassesNames?: string[]
    linkClassName?: string
    getClassesNames: (className?: string) => string
    getContainerRect: GetRect
    getHtmlEditorModalRect: GetRect
    setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
} & Available<ONS, NonEmptyArray<OptionNode>, {extensionOptionsProps: ExtensionOptionPropsArray<ONS, ONAS, WTS>}>

export default function useOptions<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, WTS extends MapOptionNodeTo<ONS, "wt">>({spanClassesNames=[], linkClassName=defaultLinkClassName, getClassesNames, getContainerRect, getHtmlEditorModalRect, setHtmlEditorVisibleTrue, extensionOptionsProps}: UseOptionsProps<ONS, ONAS, WTS>): {options: ReactNode, formModal: ReactNode, containsFormModalNode: ContainsNode} {
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
                    <Option<Text, undefined, true> getNewOptionNode={(t) => createText(t)} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={getClassesNames()}>
                      T
                    </Option>
                    {[...defaultSpanClassesNames, ...spanClassesNames].map((className) => {
                      const classesNames = getClassesNames(className)
                      return  <Option<HTMLSpanElement, undefined, true> getNewOptionNode={(t) => createSpan({innerHTML: t, className: classesNames})} withText insertInNewLine={false} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={classesNames}>
                              S
                              </Option>
                      }
                    )}
                    {linkOption}
                    {imageOption}
                    
                    {// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition 
                    extensionOptionsProps && 
                    (extensionOptionsProps as ExtensionOptionPropsArray<ONS, ONAS, WTS>).map(({className, inputsProps, children, ...extensionOptionPropsRest}) => {
                      type ON = ONS[number]
                      type ONA = ONAS[number]
                      type WT = WTS[number]
                      let showFormModal: ShowFormModal<ON, Exclude<ONA, undefined>> | undefined
                      if (inputsProps) {
                        showFormModal = (modifyNewLinks, finish) => {
                          setupFormModal<ON, Exclude<ONA, undefined>>(inputsProps, modifyNewLinks, finish)
                        }
                      }
                      return  <Option<ON, ONA, WT> setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue} className={getClassesNames(className)} showFormModal={showFormModal} {...extensionOptionPropsRest}>
                              {children}
                              </Option>
                      }
                    )}
                    </>

    return {options, formModal, containsFormModalNode}
}