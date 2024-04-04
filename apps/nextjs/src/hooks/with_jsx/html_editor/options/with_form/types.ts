import { ReactNode } from "react"
import { ContainsNodeKey, ModalKey, ModalPosition } from "../../../useModal"
import { UseFormModalReturn, FormModalNamePrefix } from "../../../forms/useFormModal"

export type UseOptionWithFormProps<P> = {
  getFormModalPosition: (height: number) => ModalPosition
  setHtmlEditorVisibleTrue: () => void
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option`]: ReactNode
} & Pick<UseFormModalReturn<N>, ModalKey<FormModalNamePrefix<N>> | ContainsNodeKey<FormModalNamePrefix<N>>>

export type UseOptionWithForm<P, N extends string> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<N>