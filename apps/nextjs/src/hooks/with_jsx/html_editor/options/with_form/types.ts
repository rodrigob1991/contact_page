import { ReactNode } from "react"
import { InputProps, InputType, InputTypesProps, InputsProps, InputsValues, MutableInputsProps } from "../../../forms/useFormModal"
import { GetLastSelectionData } from "../../useHtmlEditor"
import { AtAfterUpdateDOMEnd, OptionNode, OptionProps } from "../Option"

type ModifyInputProps<IP extends InputProps> = IP extends {type: infer T extends InputType} ? IP & {props: {value: InputTypesProps[T]["value"]}} : never
export type ModifyInputsProps<IP extends InputsProps> = IP extends readonly[infer FIP, ...infer RIP] ? FIP extends  InputProps ? IP extends MutableInputsProps ? [ModifyInputProps<FIP>, ...(RIP extends InputsProps ? ModifyInputsProps<RIP> : [])] : readonly[ModifyInputProps<FIP>, ...(RIP extends InputsProps ? ModifyInputsProps<RIP> : [])] : never : IP extends MutableInputsProps ? ModifyInputProps<IP[number]>[] : readonly ModifyInputProps<IP[number]>[] 
export type GetModifyInputsProps<ON extends OptionNode, IP extends InputsProps> = (optionNode: ON) => ModifyInputsProps<IP>
export type MapInputsValuesToAttrs<ON extends OptionNode, ONA extends Partial<ON>, IP extends InputsProps> = (inputValues: InputsValues<IP>) => ONA

export type UpdateDOM<IP extends InputsProps> = (inputsValues: InputsValues<IP>) => void
export type SetupFormModal = <IP extends InputsProps>(inputsProps: IP, updateDOM: UpdateDOM<IP>) => void
export type UseOptionWithFormProps<ON extends OptionNode, ONA extends Partial<ON>, P> = {
  setupFormModal: SetupFormModal
  atAfterUpdateDOMEnd: AtAfterUpdateDOMEnd
  getLastSelectionData: GetLastSelectionData
} & P

export type ModifiableOptionData<ON extends OptionNode, ONA extends Partial<ON>, IP extends InputsProps> = {
  getModifyInputsProps: GetModifyInputsProps<ON, IP>
  mapInputsValuesToAttrs: MapInputsValuesToAttrs<ON, ONA, IP>
}
export type UseOptionWithFormReturn<ON extends OptionNode, ONA extends Partial<ON>, IP extends InputsProps> = {
  option: ReactNode
} & ModifiableOptionData<ON, ONA, IP> & Pick<OptionProps<ON, ONA, boolean>, "type">

export type UseOptionWithForm<ON extends OptionNode, ONA extends Partial<ON>, IP extends InputsProps, P> = (props: UseOptionWithFormProps<ON, ONA, P>) => UseOptionWithFormReturn<ON, ONA, IP>