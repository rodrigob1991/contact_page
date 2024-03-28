import { ReactNode } from "react"
import { ModalPosition } from "../../../useModal"

export type UseOptionWithFormProps<P> = {
  getFormModalPosition: (height: number) => ModalPosition
  setHtmlEditorVisibleTrue: () => void
} & P
export type UseOptionWithFormReturn<N extends string> = {
  [K in `${N}Option` | `${N}FormModal`]: ReactNode
}

export type UseOptionWithForm<P, N extends string> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<N>