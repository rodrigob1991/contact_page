import { ReactNode, useState } from "react"
import { Available, IfExtends, NonEmptyArray } from "utils/src/types"
import { ContainsNode } from "../../../../components/ResizableDraggableDiv"
import { GetRect } from "../../../../types/dom"
import { createSpan, createText } from "../../../../utils/domManipulations"
import useFormModal, { InputsProps, InputsValues, SubmissionAction, UseFormModalProps } from "../../forms/useFormModal"
import { ModalPosition } from "../../useModal"
import { GetLastSelectionData, OutlineElements, ReverseOutlineElements, modalCommonProps } from "../useHtmlEditor"
import Option, { OptionNode, OptionProps, ShowFormModal } from "./Option"
import { ModifiableOptionData, SetupFormModal } from "./with_form/types"
import useImageOption, { ModifiableImageData } from "./with_form/useImageOption"
import useAnchorOption from "./with_form/useAnchorOption"

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
const defaultAnchorClassName = "linkOption"

type InputsPropsIfOptionNodeAttrs<ON extends OptionNode, ONA extends Partial<ON> | undefined> = IfExtends<ONA, [[ON, InputsProps], [undefined, undefined]]>

type ExtensionOptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, IP extends InputsPropsIfOptionNodeAttrs<ON, ONA>, WT extends boolean> = 
  Omit<OptionProps<ON, ONA, WT>, "getLastSelectionData" | "outlineElements" | "atAfterUpdateDOMEnd"> 
  & Available<ON, ONA, {inputsProps: IP} & ModifiableOptionData<ON, ONA, IP>>

export type MapOptionNodeTo<ONS extends OptionNode[], TO extends "attr" | "wt"> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? [TO extends "attr" ? Partial<ON> | undefined : boolean, ...MapOptionNodeTo<ONSR, TO>] : (TO extends "attr" ? Partial<ONS[number]> | undefined : boolean)[]
export type MapOptionNodeAttrToInputsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IP=InputsPropsIfOptionNodeAttrs<ONS[number], ONAS[number]>[]> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ?  ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? [InputsPropsIfOptionNodeAttrs<ON, ONA> , ...MapOptionNodeAttrToInputsProps<ONSR, ONASR>] : IP : IP

type ExtensionOptionPropsArray<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">, R=ExtensionOptionProps<ONS[number], ONAS[number], IPS[number], WTS[number]>[]> = 
  ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? WTS extends [infer WT extends boolean, ...infer WTSR extends MapOptionNodeTo<ONSR, "wt">] ? [ExtensionOptionProps<ON, ONA, IP, WT>, ...ExtensionOptionPropsArray<ONSR, ONASR, IPSR, WTSR>] : R : R : R : R

type ModifiableExtensionOptionsData<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? ON extends ONA ? IP extends InputsProps ? ModifiableOptionData<ON, ONA, IP> | ModifiableExtensionOptionsData<ONSR, ONASR, IPSR> : never : never : never : never : never

type ModifyOptionElement = (optionElement: HTMLElement) => void

export type UseOptionsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>,  WTS extends MapOptionNodeTo<ONS, "wt">> = {
    spanClassesNames?: string[]
    anchorClassName?: string
    getClassesNames: (className?: string) => string
    getContainerRect: GetRect
    getHtmlEditorModalRect: GetRect
    setHtmlEditorVisibleTrue: () => void
    outlineElements: OutlineElements
    reverseOutlineElements: ReverseOutlineElements
    getLastSelectionData: GetLastSelectionData
} & Available<ONS, NonEmptyArray<OptionNode>, {extensionOptionsProps: ExtensionOptionPropsArray<ONS, ONAS, IPS, WTS>}>

export default function useOptions<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">>({spanClassesNames=[], anchorClassName=defaultAnchorClassName, getClassesNames, getContainerRect, getHtmlEditorModalRect, setHtmlEditorVisibleTrue, extensionOptionsProps, ...rest}: UseOptionsProps<ONS, ONAS, IPS, WTS>): {options: ReactNode, formModal: ReactNode, setFormModalVisibleFalse: () => void, containsFormModalNode: ContainsNode, modifyOptionElement: ModifyOptionElement} {
    const atAfterUpdateDOMEnd = () => {
      setHtmlEditorVisibleTrue()
    }
    const atSubmissionActionEnd = () => {
      setFormModalVisible(false)
      atAfterUpdateDOMEnd()
    }
    
    const [formModalPropsRest, setFormModalPropsRest] = useState<Pick<UseFormModalProps, "inputsProps" | "submissionAction" | "buttonText">>({buttonText: "", inputsProps: [], submissionAction: () => {}})
    const {setFormModalVisible, formModal, getFormModalRect, containsFormModalNode} = useFormModal({showLoadingBars: false, ...formModalPropsRest, ...modalCommonProps})
    const setupFormModal: SetupFormModal = (inputsProps, updateDOM) => {
      /* type OptionNodeAttrs = Parameters<typeof modifyNewNodes>[0]
      const inputsProps: MutableInputsProps = []
      const attrs: (keyof OptionNodeAttrs)[] = []
      for (const key in inputsPropsByAttr) {
        attrs.push(key)
        inputsProps.push(inputsPropsByAttr[key])
      } */
      const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
        setFormModalVisible(false)
        updateDOM(values)
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
    const modifiableOptionsDataByType: Map<string, ModifiableAnchorData |  ModifiableImageData | ModifiableExtensionOptionsData<ONS, ONAS, IPS>> = new Map()

    const {type: anchorType, option: anchorOption, ...anchorModifiableData} = useAnchorOption({className: getClassesNames(anchorClassName), setupFormModal, ...rest})
    modifiableOptionsDataByType.set(anchorType, anchorModifiableData)
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
                    {anchorOption}
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

    const modifyOptionElement: ModifyOptionElement = (optionElement) => {
        const targetType = optionElement.dataset[optionAttributeTypePrefix]

        if (targetType) {
          const modifiableOptionsData = modifiableOptionsDataByType.get(targetType)
          if (modifiableOptionsData) {
            const {getModifyInputsProps, mapInputsValuesToAttrs} = modifiableOptionsData
            const inputsProps = getModifyInputsProps(optionElement)
            const updateDOM = (inputsValues: InputsValues<typeof inputsProps>) => {
              Object.assign(optionElement,  mapInputsValuesToAttrs(inputsValues))
            }
            setupFormModal(inputsProps, updateDOM)
          }
        }
    }

    return {options, formModal, setFormModalVisibleFalse: () => {setFormModalVisible(false)}, containsFormModalNode, modifyOptionElement}
}