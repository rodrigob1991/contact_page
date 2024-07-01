import { ReactNode, useState } from "react"
import { Available, IfExtends, NonEmptyArray } from "utils/src/types"
import { ContainsNode } from "../../../../components/ResizableDraggableDiv"
import { GetRect } from "../../../../types/dom"
import { createSpan, createText } from "../../../../utils/domManipulations"
import useFormModal, { InputsProps, InputsValues, SubmissionAction, UseFormModalProps } from "../../forms/useFormModal"
import { ModalPosition } from "../../useModal"
import { GetLastSelectionData, modalCommonProps } from "../useHtmlEditor"
import Option, { OptionNode, OptionProps, SetHtmlEditorVisibleTrue, ShowFormModal } from "./Option"
import { ModifiableOptionData, SetupFormModal } from "./with_form/types"
import useImageOption, { ModifiableImageData } from "./with_form/useImageOption"
import useLinkOption, { ModifiableLinkData } from "./with_form/useLinkOption"

//export type GetInputPropValue<E extends HTMLElement, EA extends Partial<E>, IP extends InputsPropsOptionNodeAttributes<E, EA>> = <K extends keyof IP, P = IP[K]["props"]>(key: K) => ["value"]
/* declare global {
  interface Window {
      modifyElement: <E extends HTMLElement, IPONV extends InputsPropsOptionNodeValues<E>>(element: E, inputsProps: ModifyInputsPropsOptionNode<E, IPONV>) => void
  }
} */

export const optionAttributeTypePrefix = "optionType"

const defaultTextType = "defaultText"
const spanType = "span"

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"] as const
const defaultLinkClassName = "linkOption"

type InputsPropsIfOptionNodeAttrs<ON extends OptionNode, ONA extends Partial<ON> | undefined> = IfExtends<ONA, [[ON, InputsProps], [undefined, undefined]]>

type ExtensionOptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, IP extends InputsPropsIfOptionNodeAttrs<ON, ONA>, WT extends boolean> = 
  Omit<OptionProps<ON, ONA, WT>, "setHtmlEditorVisibleTrue" | "showFormModal"> 
  & Available<ON, ONA, {inputsProps: IP} & ModifiableOptionData<ON, ONA, IP>>

export type MapOptionNodeTo<ONS extends OptionNode[], TO extends "attr" | "wt"> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? [TO extends "attr" ? Partial<ON> | undefined : boolean, ...MapOptionNodeTo<ONSR, TO>] : (TO extends "attr" ? Partial<ONS[number]> | undefined : boolean)[]
export type MapOptionNodeAttrToInputsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IP=InputsPropsIfOptionNodeAttrs<ONS[number], ONAS[number]>[]> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ?  ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? [InputsPropsIfOptionNodeAttrs<ON, ONA> , ...MapOptionNodeAttrToInputsProps<ONSR, ONASR>] : IP : IP

type ExtensionOptionPropsArray<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">, R=ExtensionOptionProps<ONS[number], ONAS[number], IPS[number], WTS[number]>[]> = 
  ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? WTS extends [infer WT extends boolean, ...infer WTSR extends MapOptionNodeTo<ONSR, "wt">] ? [ExtensionOptionProps<ON, ONA, IP, WT>, ...ExtensionOptionPropsArray<ONSR, ONASR, IPSR, WTSR>] : R : R : R : R

type ModifiableExtensionOptionsData<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? ON extends ONA ? IP extends InputsProps ? ModifiableOptionData<ON, ONA, IP> | ModifiableExtensionOptionsData<ONSR, ONASR, IPSR> : never : never : never : never : never

type ModifyTargetOption = (target: EventTarget) => void

export type UseOptionsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>,  WTS extends MapOptionNodeTo<ONS, "wt">> = {
    spanClassesNames?: string[]
    linkClassName?: string
    getClassesNames: (className?: string) => string
    getContainerRect: GetRect
    getHtmlEditorModalRect: GetRect
    setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
    getLastSelectionData: GetLastSelectionData
} & Available<ONS, NonEmptyArray<OptionNode>, {extensionOptionsProps: ExtensionOptionPropsArray<ONS, ONAS, IPS, WTS>}>

export default function useOptions<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">>({spanClassesNames=[], linkClassName=defaultLinkClassName, getClassesNames, getContainerRect, getHtmlEditorModalRect, extensionOptionsProps, ...rest}: UseOptionsProps<ONS, ONAS, IPS, WTS>): {options: ReactNode, formModal: ReactNode, containsFormModalNode: ContainsNode, modifyTargetOption: ModifyTargetOption} {
    const [formModalPropsRest, setFormModalPropsRest] = useState<Pick<UseFormModalProps, "inputsProps" | "submissionAction" | "buttonText">>({buttonText: "", inputsProps: [], submissionAction: () => {}})
    const {setFormModalVisible, formModal, getFormModalRect, containsFormModalNode} = useFormModal({showLoadingBars: false, ...formModalPropsRest, ...modalCommonProps})
    const setupFormModal: SetupFormModal = (inputsProps, modifyNewNodes, finish) => {
      /* type OptionNodeAttrs = Parameters<typeof modifyNewNodes>[0]
      const inputsProps: MutableInputsProps = []
      const attrs: (keyof OptionNodeAttrs)[] = []
      for (const key in inputsPropsByAttr) {
        attrs.push(key)
        inputsProps.push(inputsPropsByAttr[key])
      } */
      const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
        setFormModalVisible(false)
        modifyNewNodes(values)
        finish()
      } 
      setFormModalPropsRest({inputsProps, submissionAction})
      setTimeout(() => {setFormModalVisible(true, getFormModalPosition())}, 200)
    }
    const getFormModalPosition = (): ModalPosition => {
      const rangeTop = rest.getLastSelectionData()?.rect.top ?? 0
      const {top: editorTop, left: editorLeft, height: heightTop} = getHtmlEditorModalRect()
      const {top: containerTop, left: containerLeft} = getContainerRect()
      const isEditorAboveRange = editorTop < rangeTop

      return {top: `${editorTop - containerTop + (isEditorAboveRange ? -getFormModalRect().height-5 : heightTop + 5)}px`, left: `${editorLeft - containerLeft}px`}
    }
    
   /*  useEffect(() => {
      window.modifyElement = (element, inputsProps) => {
        const modifyNewNodes = (attr: Partial<typeof element>) => {
          Object.assign(element, attr)
        }
        const finish = () => {}
        setupFormModal(inputsProps, modifyNewNodes, finish)
      }
    }, []) */
    const modifiableOptionsDataByType: Map<string, ModifiableLinkData |  ModifiableImageData | ModifiableExtensionOptionsData<ONS, ONAS, IPS>> = new Map()

    const {type: linkType, option: linkOption, ...linkModifiableData} = useLinkOption({className: getClassesNames(linkClassName), setupFormModal, ...rest})
    modifiableOptionsDataByType.set(linkType, linkModifiableData)
    const {type: imageType, option: imageOption, ...imageModifiableData} = useImageOption({setupFormModal, ...rest})
    modifiableOptionsDataByType.set(imageType, imageModifiableData)

    const options = <>
                    <Option<Text, undefined, true> type={defaultTextType} getNewOptionNode={(t) => createText(t)} withText insertInNewLine={false} className={getClassesNames()} {...rest}>
                      T
                    </Option>
                    {[...defaultSpanClassesNames, ...spanClassesNames].map((className) => {
                      const classesNames = getClassesNames(className)
                      const getNewSpan = (t: string) => createSpan({innerHTML: t, className: classesNames})

                      return  <Option<HTMLSpanElement, undefined, true> type={spanType} getNewOptionNode={getNewSpan} withText insertInNewLine={false} className={classesNames} {...rest}>
                              S
                              </Option>
                      }
                    )}
                    {linkOption}
                    {imageOption}
                    
                    {// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition 
                    extensionOptionsProps && 
                    (extensionOptionsProps as ExtensionOptionPropsArray<ONS, ONAS, IPS, WTS>).map(({type, className, inputsProps, getModifyInputsProps, mapInputsValuesToAttrs, children, ...extensionOptionPropsRest}) => {
                      type ON = ONS[number]
                      type ONA = ONAS[number]
                      type WT = WTS[number]
                      let showFormModal: ShowFormModal<ON, Exclude<ONA, undefined>> | undefined
                      if (inputsProps && getModifyInputsProps && mapInputsValuesToAttrs) {
                        showFormModal = (modifyNewLinks, finish) => {
                          setupFormModal<InputsProps>(inputsProps, (inputsValues) => {modifyNewLinks(mapInputsValuesToAttrs(inputsValues))}, finish)
                        }
                        modifiableOptionsDataByType.set(type, {getModifyInputsProps, mapInputsValuesToAttrs})
                      }
                      return  <Option<ON, ONA, WT> type={type} className={getClassesNames(className)} showFormModal={showFormModal} {...extensionOptionPropsRest} {...rest}>
                              {children}
                              </Option>
                      }
                    )}
                    </>

    const modifyTargetOption: ModifyTargetOption = (target) => {
      if (target instanceof HTMLElement) {
        const targetType = target.dataset[optionAttributeTypePrefix]

        if (targetType) {
          const modifiableOptionsData = modifiableOptionsDataByType.get(targetType)
          if (modifiableOptionsData) {
            const {getModifyInputsProps, mapInputsValuesToAttrs} = modifiableOptionsData
            const inputsProps = getModifyInputsProps(target)
            const modifyNewNodes = (inputsValues: InputsValues<typeof inputsProps>) => {
              Object.assign(target,  mapInputsValuesToAttrs(inputsValues))
            }
            setupFormModal(inputsProps, modifyNewNodes, () => {})
          }
        }
      }
    }

    return {options, formModal, containsFormModalNode, modifyTargetOption}
}