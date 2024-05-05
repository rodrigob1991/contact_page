import { ReactNode } from "react"
import { Finish, ModifyNewNodes, OptionNode, SetHtmlEditorVisibleTrue } from "../Option"
import { AssignableInputProp } from "../../../forms/useFormModal"

export type InputsPropsOptionNodeAttributes<ON extends OptionNode, ONA extends Partial<ON>> = {[K in keyof ONA]: AssignableInputProp<ONA[K]>}
export type SetupFormModal = <ON extends OptionNode, ONA extends Partial<ON>>(inputsProps: InputsPropsOptionNodeAttributes<ON, ONA>, modifyNewNodes: ModifyNewNodes<ON, ONA>, finish: Finish) => void
export type UseOptionWithFormProps<P> = {
  //getFormModalPosition: (height: number) => ModalPosition
  //setHtmlEditorVisibleTrue: () => void
  setupFormModal: SetupFormModal
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option`]: ReactNode
} //& Pick<UseFormModalReturn<N>, ModalKey<FormModalNamePrefix<N>> | ContainsNodeKey<FormModalNamePrefix<N>>>

export type UseOptionWithForm<P, N extends string> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<N>