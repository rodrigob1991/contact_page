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
import { AvailableKey, NonEmptyArray } from "utils/src/types"

declare global {
  interface Window {
      modifyElement: <E extends HTMLElement, EA extends Partial<E>>(element: E, inputsProps: InputsPropsOptionNodeAttributes<E, EA>) => void
  }
}

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"] as const
/* type DefaultSpanClassName = (typeof defaultSpanClassesNames)[number]
type UseDefaultSpanClassesNames = {[K in DefaultSpanClassName]: boolean} */
const defaultLinkClassName = "linkOption"

// Define the generic type T with a parameter P
type T<P extends boolean> = {
    one: P;
    two: P extends true ? "si" : "no";
};

// Define a type for a union of T<true> and T<false>
type TUnion = T<true> | T<false>;

// Define the type L to be an object with a property `list` which is an array of TUnion objects
type L = {
    list: TUnion[];
};

// Example usage:
const exampleMixed: L = {
    list: [
        { one: true, two: "si" },
        { one: false, two: "no" }
    ]
};

type ExtensionOptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, WT extends boolean> = 
  Omit<OptionProps<ON, ONA, WT>, "setHtmlEditorVisibleTrue" | "showFormModal"> 
  & AvailableKey<ON, ONA, {inputsProps: InputsPropsOptionNodeAttributes<ON, Exclude<ONA, undefined>>}>

type ExtensionOptionPropsArray<ONA extends OptionNode[], ONAA extends (Partial<ONA[number]> | undefined)[], WTA extends boolean[], R=ExtensionOptionProps<ONA[number], ONAA[number], WTA[number]>[]> = 
  ONA extends [infer ON, ...infer ONAR] ? ONAA extends [infer ONA, ...infer ONAAR] ? WTA extends [infer WT, ...infer WTR] ? WT extends boolean ? ON extends OptionNode ? ONA extends (Partial<ON> | undefined) ?  ONAR extends OptionNode[] ? ONAAR extends (Partial<ONAR[number]> | undefined)[] ? WTR extends boolean[] ? [ExtensionOptionProps<ON, ONA, WT>, ...ExtensionOptionPropsArray<ONAR, ONAAR, WTR>] : never : never : never : never : never : never : R : R : R

type MapOptionNodeTo<ONA extends OptionNode[], TO extends "attr" | "wt", D extends Partial<ONA[number]> | undefined | boolean= TO extends "attr" ? Partial<ONA[number]> | undefined : boolean> = ONA extends [infer ON, ...infer ONAR] ? [TO extends "attr" ? Omit<D, Exclude<keyof ONAR[number], keyof ON>> | undefined : D , ...(ONAR extends [] ? MapOptionNodeTo<ONAR, TO>: [])] : D[]

type Props<ONA extends OptionNode[]=[], ONAA extends MapOptionNodeTo<ONA, "attr">=MapOptionNodeTo<ONA, "attr", undefined>, WTA extends MapOptionNodeTo<ONA, "wt">=MapOptionNodeTo<ONA, "wt", true>> = {
    spanClassesNames?: string[]
    linkClassName?: string
    getClassesNames: (className?: string) => string
    getContainerRect: GetRect
    getHtmlEditorModalRect: GetRect
    setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
} & AvailableKey<ONA, NonEmptyArray<OptionNode>, {extensionOptionsProps: ExtensionOptionPropsArray<ONA, ONAA, WTA>}>

export default function useOptions<ONA extends OptionNode[], ONAA extends MapOptionNodeTo<ONA, "attr">, WTA extends MapOptionNodeTo<ONA, "wt">>({spanClassesNames=[], linkClassName=defaultLinkClassName, getClassesNames, getContainerRect, getHtmlEditorModalRect, setHtmlEditorVisibleTrue, extensionOptionsProps}: Props<ONA, ONAA, WTA>) {
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
                    {extensionOptionsProps.map(({className, inputsProps,  ...extensionOptionsPropsRest}) => {
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