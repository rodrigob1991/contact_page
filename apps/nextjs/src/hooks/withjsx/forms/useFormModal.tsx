import styled from "@emotion/styled"
import { FormEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { upperCaseFirstChar } from "utils/src/strings"
import { ChangePropertyType } from "utils/src/types"
import { Button } from "../../../components/Buttons"
import { ResultMessage, ResultMessageProps } from "../../../components/Labels"
import { BlocksLoader } from "../../../components/Loaders"
import Checkbox, { CheckboxProps } from "../../../components/forms/Checkbox"
import ImageSelector, { ImageData, ImageSelectorProps } from "../../../components/forms/ImageSelector"
import { NumberInput, NumberInputProps } from "../../../components/forms/NumberInput"
import { TextAreaInput, TextAreaInputProps } from "../../../components/forms/TextAreaInput"
import { TextInput, TextInputProps } from "../../../components/forms/TextInput"
import { secondColor } from "../../../theme"
import useModal, { ModalName, PositionType, SetVisibleKey, SetModalVisible, UseModalProps, UseModalReturn, ModalFullName, modalDefaultName } from "../useModal"

type InputType = "textAreaInput" | "textInput" | "numberInput" | "imageSelector" | "checkbox"
type TextInputTypeProps = Omit<TextInputProps, "setValue">
type TextInputType = {type: "textInput", props?: TextInputTypeProps}
type NumberInputTypeProps = Omit<NumberInputProps, "setValue">
type NumberInputType = {type: "numberInput", props?: NumberInputTypeProps}
type TextAreaInputTypeProps = Omit<TextAreaInputProps, "setValue">
type TextAreaInputType = {type: "textAreaInput", props?: TextAreaInputTypeProps}
type ImageSelectorTypeProps = Omit<ImageSelectorProps, "setValue">
type ImageSelectorType = {type: "imageSelector", props?: ImageSelectorTypeProps}
type CheckboxTypeProps = Omit<CheckboxProps, "onChange">
type CheckboxType = {type: "checkbox", props?: CheckboxTypeProps}
type InputsProps = {[key: string]: TextInputType | NumberInputType | TextAreaInputType | ImageSelectorType | CheckboxType}
type InputValue<IT extends InputType=InputType> =  {textInput: string, textAreaInput: string, numberInput: number, imageSelector: ImageData, checkbox: boolean}[IT]
//type InputValue<IT extends InputType> =  (IT extends ("textInput" | "textAreaInput") ? string : never) | (IT extends "numberInput" ? number : never) | (IT extends "imageSelector" ? ImageData : never)
type InputsValues<IP extends InputsProps> = {
    [K in keyof IP]: InputValue<IP[K]["type"]>
}
type SetValues<IP extends InputsProps> = (iv: InputsValues<IP>) => void

const useElementsValues = <IP extends InputsProps>(inputsProps: IP) : [ReactNode, InputsValues<IP>, SetValues<IP>] => {
    const elementsRef = useRef(<></>)
    //const valuesRef = useRef({})
    const [values, setValues] = useState<InputsValues<IP>>(() => (() => {const values: {[k: string]: InputValue | undefined} = {}; Object.entries(inputsProps).forEach(([key, value]) =>  {values[key] = value.props?.value}); return values as InputsValues<IP>})())

    useEffect(() => {
        let inputs = <></>
        for (const key in inputsProps) {
            const {type, props} = inputsProps[key]
            const propsRest =  props ? (({value, ...propsRest}) =>  propsRest)(props) : undefined
            const setValue = (value: InputValue<typeof type>) => {setValues((values) => {const nextValues = {...values}; nextValues[key] = value; return nextValues})}
            let input
            switch (type) {
                case "textInput":
                    input = <TextInput {...propsRest} value={values[key]} setValue={setValue}/>
                    break
                case "numberInput":
                    input = <NumberInput {...propsRest} value={values[key]} setValue={setValue}/>
                    break
                case "textAreaInput":
                    input = <TextAreaInput {...propsRest} value={values[key]} setValue={setValue}/>
                    break
                case "imageSelector":
                    input = <ImageSelector {...propsRest} value={values[key]} processSelectedImage={setValue}/>
                    break
                case "checkbox":
                    input = <Checkbox {...propsRest} value={values[key]} onChange={setValue}/>
                    break
            }
            inputs = <>
                     {inputs}
                     {input}
                     </>
        }
        elementsRef.current = inputs
    }, [])

    return [elementsRef.current, values, setValues]
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
type SetVisibleModalArgs = Parameters<SetModalVisible>
export type SetVisible<IP extends InputsProps> = (visible: SetVisibleModalArgs[0], position?: SetVisibleModalArgs[1], values?: InputsValues<IP>) => void

const formModalDefaultNamePrefix = "form"
type FormModalDefaultNamePrefix = typeof formModalDefaultNamePrefix
type FormModalNamePrefix<N extends ModalName> = N extends undefined | "" ? FormModalDefaultNamePrefix : `${N}${Capitalize<FormModalDefaultNamePrefix>}`
export type FormModalFullName<N extends ModalName> = ModalFullName<FormModalNamePrefix<N>>
type UseFormModalProps<IP extends InputsProps, N extends ModalName, PT extends PositionType> = {
    inputsProps: IP
    buttonText: string
    submissionAction: SubmissionAction<IP>
    showLoadingBars?: boolean
} & Omit<UseModalProps<N, PT>, "children">
type UseFormModalReturn<N extends ModalName, IP extends InputsProps> = ChangePropertyType<UseModalReturn<FormModalNamePrefix<N>>, [SetVisibleKey<FormModalNamePrefix<N>>, SetVisible<IP>]>

export default function useFormModal<IP extends InputsProps, N extends ModalName=undefined, PT extends PositionType="absolute">({
                                                      inputsProps,
                                                      buttonText,
                                                      submissionAction,
                                                      showLoadingBars = true,
                                                      name,
                                                      ... modalProps
                                                      }: UseFormModalProps<IP, N, PT>) : UseFormModalReturn<N, IP> {
    const [inputs, values, setValues] = useElementsValues(inputsProps)

    const [loading, setLoading] = useState(false)

    const emptyResultMessage = {succeed: false, message: ""}
    const [resultMessage, setResultMessage] = useState<ResultMessageProps>(emptyResultMessage)
    const cleanResultMessage = () => {
        setResultMessage(emptyResultMessage)
    }

    const onHideHandler = () => {
        cleanResultMessage()
    }

    const handleSubmission: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        cleanResultMessage()
        if (showLoadingBars) setLoading(true)
 
        Promise.resolve(
        submissionAction(values))
        .then((resultMessage) => { 
            if(resultMessage)
            setResultMessage(resultMessage)
        })
        .finally(() => {setLoading(false)})
        .catch((e) => {})
    }

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
    const setFormModalVisible: SetVisible<IP> = (visible, position, values) => {
      if (values) {
        setValues(values)
      }
      (setVisible as SetModalVisible)(visible, position)
    }
    
    return {
        [setVisibleKey]: setFormModalVisible,
        ...returnRest
    }  as UseFormModalReturn<N, IP>
}