import { ReactNode } from "react"
import { InputProps, InputType, InputTypesProps, InputsProps, InputsValues } from "../../../forms/useFormModal"
import { GetLastSelectionData } from "../../useHtmlEditor"
import { Finish, OptionNode, SetHtmlEditorVisibleTrue } from "../Option"

type ModifyInputProps<IP extends InputProps> = IP extends {type: infer T extends InputType} ? IP & {props: {value: InputTypesProps[T]["value"]}} : never
export type ModifyInputsProps<IP extends InputsProps> = IP extends [infer FIP, ...infer RIP] ? FIP extends  InputProps ? [ModifyInputProps<FIP>, ...(RIP extends InputsProps ? ModifyInputsProps<RIP> : [])] : never : ModifyInputProps<IP[number]>[]
export type GetModifyInputsProps<ON extends OptionNode, IP extends InputsProps> = (optionNode: ON) => ModifyInputsProps<IP>
export type MapInputsValuesToAttrs<ON extends OptionNode, IP extends InputsProps> = (inputValues: InputsValues<IP>) => Partial<ON>

export type ModifyNewNodes<IP extends InputsProps> = (inputsValues: InputsValues<IP>) => void
export type SetupFormModal = <IP extends InputsProps>(inputsProps: IP, modifyNewNodes: ModifyNewNodes<IP>, finish: Finish) => void
export type UseOptionWithFormProps<P> = {
  setupFormModal: SetupFormModal
  setHtmlEditorVisibleTrue: SetHtmlEditorVisibleTrue
  getLastSelectionData: GetLastSelectionData
} & P

export type UseOptionWithFormReturn<ON extends OptionNode, IP extends InputsProps, N extends string, CN extends string= Capitalize<N>, K1 extends string = `${N}OptionType`, K2 extends string = `get${CN}ModifyInputsProps`, K3 extends string = `map${CN}InputsValuesToAttrs`, K4 extends string = `${N}Option`> = {
  [K in K1 | K2 | K3 | K4]: K extends K1 ? string : K extends K2 ? GetModifyInputsProps<ON, IP> : K extends K3 ? MapInputsValuesToAttrs<ON, IP> : ReactNode
} 

export type UseOptionWithForm<ON extends OptionNode, IP extends InputsProps, N extends string, P> = (props: UseOptionWithFormProps<P>) => UseOptionWithFormReturn<ON, IP, N>