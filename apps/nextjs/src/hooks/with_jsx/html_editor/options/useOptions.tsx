import { ReactNode, useState } from "react"
import { Available, IfFirstExtendsThenSecond, NonEmptyArray } from "utils/src/types"
import { GetRect } from "../../../../types/dom"
import { createSpan, createText, getRelativeRect } from "../../../../utils/domManipulations"
import useFormModal, { FormModalNamePrefix, InputsProps, InputsValues, SubmissionAction, UseFormModalProps } from "../../forms/useFormModal"
import { DoesContainsNodeReturn, ModalPosition, ModalReturn } from "../../useModal"
import { GetLastSelectionData, HtmlEditorPositionType, modalCommonProps } from "../useHtmlEditor"
import Option, { AtAfterUpdateDOMEnd, OptionNode, OptionProps, ShowFormModal } from "./Option"
import { ModifiableOptionData, SetupFormModal } from "./with_form/types"
import useAnchorOption, { ModifiableAnchorData } from "./with_form/useAnchorOption"
import useImageOption, { ModifiableImageData } from "./with_form/useImageOption"

//export type GetInputPropValue<E extends HTMLElement, EA extends Partial<E>, IP extends InputsPropsOptionNodeAttributes<E, EA>> = <K extends keyof IP, P = IP[K]["props"]>(key: K) => ["value"]
/* declare global {
  interface Window {
      modifyElement: <E extends HTMLElement, IPONV extends InputsPropsOptionNodeValues<E>>(element: E, inputsProps: ModifyInputsPropsOptionNode<E, IPONV>) => void
  }
} */

export const optionAttributeTypePrefix = "optionType"

// const defaultTextType = "defaultText"
// const spanType = "span"

const defaultSpanClassesNames = ["blackTextOption", "blackUnderlineTextOption", "redTextOption", "blackTitleTextOption"] as const
const defaultAnchorClassName = "linkOption"

type InputsPropsIfOptionNodeAttrs<ON extends OptionNode, ONA extends Partial<ON> | undefined> = IfFirstExtendsThenSecond<ONA, [[ON, InputsProps], [undefined, undefined]]>

type ExtensionOptionProps<ON extends OptionNode, ONA extends Partial<ON> | undefined, IP extends InputsPropsIfOptionNodeAttrs<ON, ONA>, WT extends boolean> = 
  Omit<OptionProps<ON, ONA, WT>, "getLastSelectionData" | "outlineElements" | "atAfterUpdateDOMEnd"> 
  & Available<ON, ONA, {inputsProps: IP, insertNodesBeforeShowFormModal: boolean} & ModifiableOptionData<ON, ONA, IP>>

export type MapOptionNodeTo<ONS extends OptionNode[], TO extends "attr" | "wt"> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? [TO extends "attr" ? Partial<ON> | undefined : boolean, ...MapOptionNodeTo<ONSR, TO>] : (TO extends "attr" ? Partial<ONS[number]> | undefined : boolean)[]
export type MapOptionNodeAttrToInputsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IP=InputsPropsIfOptionNodeAttrs<ONS[number], ONAS[number]>[]> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ?  ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? [InputsPropsIfOptionNodeAttrs<ON, ONA> , ...MapOptionNodeAttrToInputsProps<ONSR, ONASR>] : IP : IP

type ExtensionOptionPropsArray<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">, R=ExtensionOptionProps<ONS[number], ONAS[number], IPS[number], WTS[number]>[]> = 
  ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? WTS extends [infer WT extends boolean, ...infer WTSR extends MapOptionNodeTo<ONSR, "wt">] ? [ExtensionOptionProps<ON, ONA, IP, WT>, ...ExtensionOptionPropsArray<ONSR, ONASR, IPSR, WTSR>] : R : R : R : R

export type UseOptionsProps<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>,  WTS extends MapOptionNodeTo<ONS, "wt">> = {
    positionType: HtmlEditorPositionType
    getHtmlEditorRect: GetRect
    getContainerRect: GetRect
    getLastSelectionData: GetLastSelectionData
    defaultTextClassName?: string
    spanClassesNames?: string[]
    anchorClassName?: string
    getClassesNames: (className?: string) => string
    atAfterUpdateDOMEnd: AtAfterUpdateDOMEnd
} & Available<ONS, NonEmptyArray<OptionNode>, {extensionsProps: ExtensionOptionPropsArray<ONS, ONAS, IPS, WTS>}>

type ModifiableExtensionOptionsData<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>> = ONS extends [infer ON extends OptionNode, ...infer ONSR extends OptionNode[]] ? ONAS extends [infer ONA extends Partial<ON>, ...infer ONASR extends MapOptionNodeTo<ONSR, "attr">] ? IPS extends [infer IP extends InputsPropsIfOptionNodeAttrs<ON,ONA>, ...infer IPSR extends MapOptionNodeAttrToInputsProps<ONSR, ONASR>] ? ON extends ONA ? IP extends InputsProps ? ModifiableOptionData<ON, ONA, IP> | ModifiableExtensionOptionsData<ONSR, ONASR, IPSR> : never : never : never : never : never
export type HighlightTarget = Range | OptionNode
export type HighlightTargets = HighlightTarget[]
export type Highlight = (...targets: HighlightTargets) => void

type SelectOptionElement = (optionElement: HTMLElement) => void
type Return = {
    options: ReactNode
    setFormModalVisibleFalse: () => void
    selectOptionElement: SelectOptionElement
    highlightsRects: DOMRect[]
}   & DoesContainsNodeReturn<FormModalNamePrefix>
    & ModalReturn<FormModalNamePrefix>

export default function useOptions<ONS extends OptionNode[], ONAS extends MapOptionNodeTo<ONS, "attr">, IPS extends MapOptionNodeAttrToInputsProps<ONS, ONAS>, WTS extends MapOptionNodeTo<ONS, "wt">>({positionType, getHtmlEditorRect, getContainerRect, getLastSelectionData, defaultTextClassName, spanClassesNames=[], anchorClassName=defaultAnchorClassName, getClassesNames, atAfterUpdateDOMEnd: atAfterUpdateDOMEndProp, extensionsProps, ...optionPropsRest}: UseOptionsProps<ONS, ONAS, IPS, WTS>): Return {
    const atAfterUpdateDOMEnd = () => {
      atAfterUpdateDOMEndProp()
    }

    const [formModalPropsRest, setFormModalPropsRest] = useState<Pick<UseFormModalProps, "inputsProps" | "submissionAction" | "buttonText">>({buttonText: "", inputsProps: [], submissionAction: () => {}})
    const {setFormModalVisible, formModal, getFormModalRect, doesFormModalContainsNode} = useFormModal({showLoadingBars: false, ...formModalPropsRest, ...modalCommonProps})
    const setupFormModal: SetupFormModal = (inputsProps, updateDOM, when="insert") => {
      const lastSelectionData = getLastSelectionData()
      // should always be true when setupFormModal invoked
      if (lastSelectionData) {
        const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
          updateDOM(values)
          setFormModalVisible(false)
        } 
        setFormModalPropsRest({inputsProps, submissionAction})

        const getPosition = (): ModalPosition => {
          const {top: containerTop, left: containerLeft, right: containerRight, width: containerWidth} = getContainerRect()
          const {top: editorTop, left: editorLeft, right: editorRight, height: editorHeight, width: editorWidth} = getHtmlEditorRect()
          const {height, width} = getFormModalRect()
          const {mousePosition, getRect: getSelectionRect} = lastSelectionData
          const {top: selectionTop, left: selectionLeft, height: selectionHeight, width: selectionWidth, bottom: selectionBottom, isMouseAboveMiddle} = getSelectionRect()

          let left
          let top
          // aside editor
          if (when === "insert" || positionType === "selection") {
            if (editorLeft - width >= 0) {
              left = editorLeft - width - 5
            } else if (editorRight + width <= containerWidth) {
              console.log("editor right:" + editorRight)
              left = editorRight + 5
            } else {
              left = editorLeft
              const leftOffset = left - (containerWidth - width)
              left -= leftOffset > 0 ? leftOffset : 0 
            }
            top = editorTop - (isMouseAboveMiddle ?  height - editorHeight : 0)
          } else {
            top = selectionTop + (isMouseAboveMiddle ? selectionHeight + 5 : -(height + 5))
            left = mousePosition.x 
            const leftOffset = left - (containerWidth - width)
            left -= leftOffset > 0 ? leftOffset : 0
          }

          return {top: `${top}px`, left: `${left}px`}
        }

        setTimeout(() => {setFormModalVisible(true, getPosition())}, 200)
      }
    }

    /* const highlightTargetsRef = useRef<HighlightTargets>([])
    const setHighlightTargets = (targets: HighlightTargets) => {
      highlightTargetsRef.current = targets
    }
    const getHighlightTargets = () => highlightTargetsRef.current
    const removeHighlights = () => {
      getHighlightTargets().forEach((target) => {
        if (target instanceof HTMLElement) {
          target.style.outlineStyle = "none"
        } else if (target instanceof Range) {
          const content = target.extractContents()
          content.replaceChildren(...content.firstChild?.childNodes)
          target.insertNode(content)
        } else {
          target.parentElement?.replaceWith(target)
        }
      })
      setHighlightTargets([])
    }
    const highlight: Highlight = (...targets) => {
      removeHighlights()
      targets.forEach(target => {
        let outlinedElement
        if (target instanceof HTMLElement) {
          outlinedElement = target
        } else {
          outlinedElement = createSpan()
          if (target instanceof Range) {
            target.surroundContents(outlinedElement)
          } else {
            outlinedElement.appendChild(target)
            target.parentElement?.replaceChild(outlinedElement, target)
          }
        }  
        outlinedElement.style.outlineStyle = "solid"
      })
      setHighlightTargets(targets)
    } */
      const [highlightsRects, setHighlightsRects] = useState<DOMRect[]>([])
      const highlight: Highlight = (...targets) => {
        const rects: DOMRect[] = []
        targets.forEach(target => {
          if (target instanceof HTMLElement) {
            rects.push(...target.getClientRects())
          } else {
            let range
            if (target instanceof Range) {
              range = target
            } else {
              range = document.createRange()
              range.selectNodeContents(target)
            }
            rects.push(...range.getClientRects())
          }  
        })
        setHighlightsRects(rects.map(r => getRelativeRect(r, getContainerRect())))
      }

    const commonOptionProps = {getLastSelectionData, highlight, ...optionPropsRest}
    
    type ModifiableOptionData = ModifiableAnchorData |  ModifiableImageData | ModifiableExtensionOptionsData<ONS, ONAS, IPS>
    const modifiableOptionsDataByType: Map<string, ModifiableOptionData> = new Map()
    const setModifiableOptionData = (type: string, modifiableOptionData: ModifiableOptionData) => {
      modifiableOptionsDataByType.set(type.toLowerCase(), modifiableOptionData)
    }
    const getModifiableOptionData = (type: string) => modifiableOptionsDataByType.get(type.toLowerCase())

    const defaultTextOptionProps = {
      type: "defaultText",
      className: defaultTextClassName,
      getNewOptionNode: (t: string) => createText(t),
      withText: true,
      insertInNewLine: false,
      atAfterUpdateDOMEnd,
      ...commonOptionProps
    } as const
    const defaultTextOption = <Option<Text, undefined, true> {...defaultTextOptionProps}>
                                T
                              </Option>

    const spanOptions = [...defaultSpanClassesNames, ...spanClassesNames].map((className) => {
      const classesNames = getClassesNames(className)
      const spanOptionProps = {
        type: "span",
        className: classesNames,
        getNewOptionNode: (t: string) => createSpan({innerHTML: t, className: classesNames}),
        withText: true,
        insertInNewLine: false,
        atAfterUpdateDOMEnd,
        ...commonOptionProps
      } as const

      return  <Option<HTMLSpanElement, undefined, true> {...spanOptionProps}>
              S
              </Option>
      }
    )

    const {type: anchorType, option: anchorOption, ...anchorModifiableData} = useAnchorOption({className: getClassesNames(anchorClassName), setupFormModal, atAfterUpdateDOMEnd, ...commonOptionProps})
    setModifiableOptionData(anchorType, anchorModifiableData)

    const {type: imageType, option: imageOption, ...imageModifiableData} = useImageOption({setupFormModal, atAfterUpdateDOMEnd, ...commonOptionProps})
    setModifiableOptionData(imageType, imageModifiableData)

    const extensionOptions = extensionsProps ? 
    (extensionsProps as ExtensionOptionPropsArray<ONS, ONAS, IPS, WTS>).map(({type, className, inputsProps, getModifyInputsProps, mapInputsValuesToAttrs, children, ...extensionOptionPropsRest}) => {
      type ON = ONS[number]
      type ONA = ONAS[number]
      type WT = WTS[number]
      let showFormModal: ShowFormModal<ON, Exclude<ONA, undefined>> | undefined
      if (inputsProps && getModifyInputsProps && mapInputsValuesToAttrs) {
        showFormModal = (updateDOM) => {
          setupFormModal<InputsProps>(inputsProps, (inputsValues) => {updateDOM(mapInputsValuesToAttrs(inputsValues))})
        }
        setModifiableOptionData(type, {getModifyInputsProps, mapInputsValuesToAttrs})
      }

      const optionProps = {
        type,
        className: getClassesNames(className),
        showFormModal,
        atAfterUpdateDOMEnd,
        ...commonOptionProps,
        ...extensionOptionPropsRest
      }

      return  <Option<ON, ONA, WT> {...optionProps}>
              {children}
              </Option>
      }
    ) : ""

    const options = <>
                    {defaultTextOption}
                    {spanOptions}
                    {anchorOption}
                    {imageOption}
                    {extensionOptions}
                    </>

    const selectOptionElement: SelectOptionElement = (element) => {
        highlight(element)
        const type = element.dataset[optionAttributeTypePrefix] ?? element.tagName
        const modifiableOptionData = getModifiableOptionData(type)
        if (modifiableOptionData) {
          const {getModifyInputsProps, mapInputsValuesToAttrs} = modifiableOptionData
          const inputsProps = getModifyInputsProps(element)
          const updateDOM = (inputsValues: InputsValues<typeof inputsProps>) => {
            Object.assign(element,  mapInputsValuesToAttrs(inputsValues))
          }
          setupFormModal(inputsProps, updateDOM, "select")
        }
    }

    return {options, formModal, setFormModalVisibleFalse: () => {setFormModalVisible(false)}, doesFormModalContainsNode, selectOptionElement, highlightsRects}
}