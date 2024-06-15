import { ReactNode } from "react"
import { Finish, OptionNode, SetHtmlEditorVisibleTrue } from "../Option"
import { AssignableInputProp, InputTypesProps } from "../../../forms/useFormModal"
import { GetLastSelectionData } from "../../useHtmlEditor"

export type InputsPropsOptionNodeValues<ON extends OptionNode> = Record<string, ON[keyof ON]>
export type InputsPropsOptionNode<ON extends OptionNode, IPONV extends InputsPropsOptionNodeValues<ON>=InputsPropsOptionNodeValues<ON>> = {[K in keyof IPONV]: AssignableInputProp<IPONV[K]>}
export type ModifyInputsPropsOptionNode<ON extends OptionNode, IPON extends InputsPropsOptionNode<ON>> = {
  [K1 in keyof IPON]: {
    [K2 in keyof (IPON[K1] & {props: {}})]: K2 extends "props" ? IPON[K1][K2] & {value: InputTypesProps[IPON[K1]["type"]]["value"]} : IPON[K1][K2]
  }
}
export type ModifyNewNodes<ON extends OptionNode, IPONV extends InputsPropsOptionNodeValues<ON>> = (atrr: IPONV) => void
export type SetupFormModal = <ON extends OptionNode, IPONV extends InputsPropsOptionNodeValues<ON>>(inputsProps: InputsPropsOptionNode<ON, IPONV>, modifyNewNodes: ModifyNewNodes<ON, IPONV>, finish: Finish) => void
export type UseOptionWithFormProps<P> = {
  setupFormModal: SetupFormModal
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
  getLastSelectionData: GetLastSelectionData
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option`]: ReactNode
} 

export type UseOptionWithForm<P, N extends string> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<N>