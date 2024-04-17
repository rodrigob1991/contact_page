import { ReactNode } from "react"
import { Finish, ModifyNewNodes, OptionNode } from "../Option"
import { AssignableInputProp } from "../../../forms/useFormModal"

export type UseOptionWithFormProps<P, ON extends OptionNode, ONA extends Partial<ON>> = {
  //getFormModalPosition: (height: number) => ModalPosition
  //setHtmlEditorVisibleTrue: () => void
  setupFormModal: (inputsProps: {[K in keyof ONA]: AssignableInputProp<ONA[K]>}, modifyNewNodes: ModifyNewNodes<ONA>, finish: Finish) => void
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option`]: ReactNode
} //& Pick<UseFormModalReturn<N>, ModalKey<FormModalNamePrefix<N>> | ContainsNodeKey<FormModalNamePrefix<N>>>

export type UseOptionWithForm<P, N extends string, ON extends OptionNode, ONA extends Partial<ON>> = (props: UseOptionWithFormProps<P, ON, ONA>) => UseOptionWithFormReturn<N>