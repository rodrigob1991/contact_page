import styled from "@emotion/styled"
import { FormEventHandler, ReactNode, useEffect, useRef, useState } from "react"
import { Button } from "../../../components/Buttons"
import { ResultMessage, ResultMessageProps } from "../../../components/Labels"
import { BlocksLoader } from "../../../components/Loaders"
import { NumberInput, NumberInputProps } from "../../../components/forms/NumberInput"
import { TextAreaInput, TextAreaInputProps } from "../../../components/forms/TextAreaInput"
import { TextInput, TextInputProps } from "../../../components/forms/TextInput"
import { secondColor } from "../../../theme"
import useModal, { SetVisible, UseModalProps } from "../useModal"
import { ContainsNode } from "../../../components/ResizableDraggableDiv"

type InputType = "textAreaInput" | "textInput" | "numberInput"
type TextInputTypeProps = Omit<TextInputProps, "setValue">
type TextInputType = {type: "textInput", props?: TextInputTypeProps}
type NumberInputTypeProps = Omit<NumberInputProps, "setValue">
type NumberInputType = {type: "numberInput", props?: NumberInputTypeProps}
type TextAreaInputTypeProps = Omit<TextAreaInputProps, "setValue">
type TextAreaInputType = {type: "textAreaInput", props?: TextAreaInputTypeProps}
type InputsProps = { [key: string]: TextInputType | NumberInputType | TextAreaInputType}
type InputValue<IT extends InputType> =  (IT extends ("textInput" | "textAreaInput") ? string : never) | (IT extends "numberInput" ? number : never)
type InputsValues<E extends InputsProps> = {
    [K in keyof E]: E[K]["type"] extends ("textInput" | "textAreaInput") ? string : E[K]["type"] extends "numberInput" ? number :  never
}

const useElementsValues = <IP extends InputsProps>(inputsProps: IP) : [ReactNode, InputsValues<IP>]  => {
    const elementsRef = useRef(<></>)
    const valuesRef = useRef({})

    useEffect(() => {
        let inputs = <></>
        for (const key in inputsProps) {
            const {type, props} = inputsProps[key]
            let input
            switch (type) {
                case "textInput":
                    input = <TextInput {...props} setValue={(value) => {Object.assign(valuesRef.current, {key: value})}}/>
                    break
                case "numberInput":
                    input = <NumberInput {...props} setValue={(value) => {Object.assign(valuesRef.current, {key: value})}}/>
                    break
                case "textAreaInput":
                    input = <TextAreaInput {...props} setValue={(value) => {Object.assign(valuesRef.current, {key: value})}}/>
                    break
            }
            inputs = <>
                     {inputs}
                     {input}
                     </>
        }
        elementsRef.current = inputs
    }, [])

    return [elementsRef.current, valuesRef.current as InputsValues<IP>]
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

type UseFormModalProps<IP extends InputsProps> = {
    inputsProps: IP
    buttonText: string
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    submissionAction: (values: InputsValues<IP>) => Promise<ResultMessageProps> | void
} & Omit<UseModalProps, "children">

export default function useFormModal<IP extends InputsProps>({
                                                      inputsProps,
                                                      buttonText,
                                                      submissionAction,
                                                      ... modalProps
                                                      }: UseFormModalProps<IP>) : [SetVisible, ReactNode, ContainsNode] {
    const [inputs, inputsValues] = useElementsValues(inputsProps)

    const [loading, setLoading] = useState(false)

    const emptyResultMessage = {succeed: false, message: ""}
    const [resultMessage, setResultMessage] = useState<ResultMessageProps>(emptyResultMessage)
    const cleanResultMessage = () => {
        setResultMessage(emptyResultMessage)
    }

    const handleOnHide = () => {
        cleanResultMessage()
    }

    const handleSubmission: FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault()
        cleanResultMessage()
        setLoading(true)
 
        Promise.resolve(
        submissionAction(inputsValues))
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
                    <BlocksLoader show={loading}/>
                    <ResultMessage {...resultMessage}/>
                    </FormContainer>
    

    return useModal({children, handleOnHide, ...modalProps})
}