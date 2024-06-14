import { ReactNode } from "react"
import { Finish, ModifyNewNodes, OptionNode, SetHtmlEditorVisibleTrue } from "../Option"
import { AssignableInputProp } from "../../../forms/useFormModal"
import { GetLastSelectionData } from "../../useHtmlEditor"

export type InputsPropsOption<ON extends OptionNode, A extends Record<string, ON[keyof ON]>> = {[K in keyof A]: AssignableInputProp<A[K]>}
export type ModifyInputsProps<ON extends OptionNode, IPO extends InputsPropsOption<O>> = {
  [K1 in keyof InputsProps]: {
    [K2 in keyof InputsProps[K1]]: K2 extends "props" ? InputsProps[K1][K2] & {value: InputTypesProps[InputsProps[K1]["type"]]["value"]} : InputsProps[K1][K2]
  }
}
export type SetupFormModal = <ON extends OptionNode, ONA extends Partial<ON>>(inputsProps: InputsPropsOption<ON, ONA>, modifyNewNodes: ModifyNewNodes<ON, ONA>, finish: Finish) => void
export type UseOptionWithFormProps<P> = {
  //getFormModalPosition: (height: number) => ModalPosition
  //setHtmlEditorVisibleTrue: () => void
  setupFormModal: SetupFormModal
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
  getLastSelectionData: GetLastSelectionData
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option`]: ReactNode
} //& Pick<UseFormModalReturn<N>, ModalKey<FormModalNamePrefix<N>> | ContainsNodeKey<FormModalNamePrefix<N>>>

export type UseOptionWithForm<P, N extends string> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<N>