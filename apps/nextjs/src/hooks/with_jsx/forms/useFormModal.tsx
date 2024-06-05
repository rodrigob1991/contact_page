import styled from "@emotion/styled"
import { FormEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { upperCaseFirstChar } from "utils/src/strings"
import { Button } from "../../../components/Buttons"
import { ResultMessage, ResultMessageProps } from "../../../components/Labels"
import { BlocksLoader } from "../../../components/Loaders"
import Checkbox, { CheckboxProps } from "../../../components/forms/Checkbox"
import ImageSelector, { ImageSelectorProps } from "../../../components/forms/ImageSelector"
import { NumberInput, NumberInputProps } from "../../../components/forms/NumberInput"
import { TextAreaInput, TextAreaInputProps } from "../../../components/forms/TextAreaInput"
import { TextInput, TextInputProps } from "../../../components/forms/TextInput"
import { secondColor } from "../../../theme"
import useModal, { ModalFullName, ModalName, PositionType, SetModalVisible, SetVisibleKey, UseModalProps, UseModalReturn, modalDefaultName } from "../useModal"

//type InputType = "textAreaInput" | "textInput" | "numberInput" | "imageSelector" | "checkbox"
type TextInputTypeProps = Omit<TextInputProps, "setValue">
//type TextInputType = {type: "textInput", props?: TextInputTypeProps}
type NumberInputTypeProps = Omit<NumberInputProps, "setValue">
//type NumberInputType = {type: "numberInput", props?: NumberInputTypeProps}
type TextAreaInputTypeProps = Omit<TextAreaInputProps, "setValue">
//type TextAreaInputType = {type: "textAreaInput", props?: TextAreaInputTypeProps}
type ImageSelectorTypeProps = Omit<ImageSelectorProps, "setValue" | "processSelectedImage">
//type ImageSelectorType = {type: "imageSelector", props?: ImageSelectorTypeProps}
type CheckboxTypeProps = Omit<CheckboxProps, "onChange">
//type CheckboxType = {type: "checkbox", props?: CheckboxTypeProps}
type InputTypesProps = {textInput: TextInputTypeProps, textAreaInput: TextAreaInputTypeProps, numberInput: NumberInputTypeProps, imageSelector: ImageSelectorTypeProps, checkbox: CheckboxTypeProps}
type InputType = keyof InputTypesProps
type InputProp<IT extends InputType=InputType> = {[K in IT]: {type: K, props?: InputTypesProps[K]}}[IT]
//export type InputsProps = {[key: string]: InputProp}
export type InputsProps = readonly InputProp[]
type InputValue<IT extends InputType=InputType> = Exclude<InputTypesProps[IT]["value"], undefined>
//type InputValue<IT extends InputType=InputType> = {textInput: string, textAreaInput: string, numberInput: number, imageSelector: ImageData, checkbox: boolean}[IT]
// export type InputsValues<IP extends InputsProps> = {
//     [K in keyof IP]: InputValue<IP[K]["type"]>
// }
export type InputsValues<IP extends InputsProps> = IP extends readonly[infer F, ...infer R] ? F extends  InputProp ? [InputValue<F["type"]>, ...(R extends InputsProps ? InputsValues<R> : [])] : [] : []

//export type AssignableInputType<V extends InputValue> = {[K in InputType]: V extends InputValue<K> ? K : never}[InputType]
export type AssignableInputProp<V> = {[K in InputType]: V extends InputValue<K> ? InputProp<K> : never}[InputType]
//type SetValues<IP extends InputsProps> = (iv: InputsValues<IP>) => void

const useInputsValues = <IP extends InputsProps>(inputsProps: IP) : [ReactNode, InputsValues<IP> | undefined, () => void] => {
    //const elementsRef = useRef(<></>)
    const [inputs, setInputs] = useState(<></>)
    //const valuesRef = useRef({})
    const [values, setValues] = useState<InputsValues<IP>>()
    const firstInputRef = useRef<HTMLInputElement | null>(null)
    const setFirstInputRef = (input: HTMLInputElement | null) => {if(!firstInputRef.current) firstInputRef.current = input}

    useEffect(() => {
        let inputs = <></>
        const values = []
        let index = 0
        for (const {type, props} of inputsProps) {
            //const {type, props} = inputsProps[key]
            //const propsRest =  props ? (({value, ...propsRest}) =>  propsRest)(props) : undefined
            const setValue = (value: InputValue<typeof type>) => {
                setValues((values) => {
                    let nextValues: InputsValues<IP> | undefined = undefined
                    if (values) {
                        nextValues = [...values]
                        nextValues[index] = value
                    }
                    return nextValues
                })
            }
            let input
            switch (type) {
                case "textInput":
                    input = <TextInput ref={setFirstInputRef} {...props} setValue={setValue}/>
                    break
                case "numberInput":
                    input = <NumberInput ref={setFirstInputRef} {...props} setValue={setValue}/>
                    break
                case "textAreaInput":
                    input = <TextAreaInput ref={setFirstInputRef} {...props} setValue={setValue}/>
                    break
                case "imageSelector":
                    input = <ImageSelector ref={setFirstInputRef} {...props} processSelectedImage={setValue}/>
                    break
                case "checkbox":
                    input = <Checkbox ref={setFirstInputRef} {...props} onChange={setValue}/>
                    break
            }
            inputs = <>
                     {inputs}
                     {input}
                     </>
            values.push(props?.value)

            index++
        }
        setInputs(inputs)
        setValues(values as InputsValues<IP>)
    }, [inputsProps])

    const focusFirstInput = () => {
      console.table(firstInputRef.current)
      firstInputRef.current?.focus()
    }

    return [inputs, values, focusFirstInput]
}

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  background-color: ${secondColor};
  border-radius: 10px;
 `
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type SubmissionAction<IP extends InputsProps> = (values: InputsValues<IP>) => Promise<ResultMessageProps> | void
//type SetVisibleModalArgs = Parameters<SetModalVisible>
//export type SetFormModalVisible<IP extends InputsProps> = (visible: SetVisibleModalArgs[0], position?: SetVisibleModalArgs[1], values?: InputsValues<IP>) => void

const formModalDefaultNamePrefix = "form"
type FormModalDefaultNamePrefix = typeof formModalDefaultNamePrefix
export type FormModalNamePrefix<N extends ModalName> = N extends undefined | "" ? FormModalDefaultNamePrefix : `${N}${Capitalize<FormModalDefaultNamePrefix>}`
export type FormModalFullName<N extends ModalName> = ModalFullName<FormModalNamePrefix<N>>

export type UseFormModalProps<IP extends InputsProps=InputsProps, N extends ModalName=undefined, PT extends PositionType="absolute"> = {
    inputsProps: IP
    submissionAction: SubmissionAction<IP>
    buttonText?: string
    showLoadingBars?: boolean
} & Omit<UseModalProps<N, PT>, "children">

//type UseFormModalReturn<N extends ModalName, IP extends InputsProps> = ChangePropertyType<UseModalReturn<FormModalNamePrefix<N>>, [SetVisibleKey<FormModalNamePrefix<N>>, SetFormModalVisible<IP>]>
export type UseFormModalReturn<N extends ModalName> = UseModalReturn<FormModalNamePrefix<N>>

export default function useFormModal<IP extends InputsProps, N extends ModalName=undefined, PT extends PositionType="absolute">({
                                                      inputsProps,
                                                      submissionAction,
                                                      buttonText="accept",
                                                      showLoadingBars = true,
                                                      name,
                                                      ... modalProps
                                                      }: UseFormModalProps<IP, N, PT>) : UseFormModalReturn<N> {
    const [inputs, values, focusFirstInput] = useInputsValues(inputsProps)

    const [loading, setLoading] = useState(false)

    const emptyResultMessage = {succeed: false, message: ""}
    const [resultMessage, setResultMessage] = useState<ResultMessageProps>(emptyResultMessage)
    const cleanResultMessage = () => {
        setResultMessage(emptyResultMessage)
    }

    const onHideHandler = () => {
        cleanResultMessage()
    }

    const handleSubmission: FormEventHandler<HTMLFormElement> | undefined =
      values
        ? (e) => {
            e.preventDefault()
            cleanResultMessage()
            if (showLoadingBars) setLoading(true)

            Promise.resolve(submissionAction(values))
              .then((resultMessage) => {
                if (resultMessage) setResultMessage(resultMessage)
              })
              .finally(() => {
                setLoading(false)
              })
              .catch((e) => {})
          }
        : undefined

    const children = <FormContainer onSubmit={handleSubmission}>
                     {inputs}
                     <Button disabled={loading}>{buttonText}</Button>
                     {showLoadingBars && <BlocksLoader show={loading}/>}
                     <ResultMessage {...resultMessage}/>
                     </FormContainer>
    
    const namePrefix = (name ?  name + upperCaseFirstChar(formModalDefaultNamePrefix) : formModalDefaultNamePrefix) as FormModalNamePrefix<N>
    const fullName = namePrefix + upperCaseFirstChar(modalDefaultName) as FormModalFullName<N>
    const setVisibleKey: SetVisibleKey<FormModalNamePrefix<N>> = `set${upperCaseFirstChar(fullName)}Visible`
    const {[setVisibleKey]: setVisible, ...returnRest} = useModal({name: namePrefix, children, onHideHandler, ...modalProps})
    const setFormModalVisible: SetModalVisible = (visible, position) => {
      (setVisible as SetModalVisible)(visible, position)
      if(visible) 
        setTimeout(() => {focusFirstInput()}, 200)
    }
    
    return {
        [setVisibleKey]: setFormModalVisible,
        ...returnRest
    } as UseFormModalReturn<N>
}