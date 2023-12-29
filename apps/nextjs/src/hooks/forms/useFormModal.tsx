import styled from "@emotion/styled"
import { FormEventHandler, useEffect, useRef, useState } from "react"
import { Button } from "../../components/Buttons"
import { ResultMessage, ResultMessageProps } from "../../components/Labels"
import { BlocksLoader } from "../../components/Loaders"
import { PositionCSS, SizeCSS } from "../../components/ResizableDraggableDiv"
import { secondColor } from "../../theme"
import useModal from "../useModal"
import { TextInput, TextInputProps } from "../../components/forms/TextInput"
import { NumberInput, NumberInputProps } from "../../components/forms/NumberInput"
import { TextAreaInput, TextAreaInputProps } from "../../components/forms/TextAreaInput"

type InputType = "textAreaInput" | "textInput" | "numberInput"
type TextInputType = {type: "textInput", props: Omit<TextInputProps, "setValue">}
type NumberInputType = {type: "numberInput", props: Omit<NumberInputProps, "setValue">}
type TextAreaInputType = {type: "textAreaInput", props: Omit<TextAreaInputProps, "setValue">}
type InputsProps = { [key: string]: TextInputType | NumberInputType | TextAreaInputType}
type InputValue<IT extends InputType> =  (IT extends ("textInput" | "textAreaInput") ? string : never) | (IT extends "numberInput" ? number : never)
type InputsValues<E extends InputsProps> = {
    [K in keyof E]: E[K]["type"] extends ("textInput" | "textAreaInput") ? string : E[K]["type"] extends "numberInput" ? number :  never
}

const useElementsValues = <IP extends InputsProps>(inputsProps: IP) : [JSX.Element, InputsValues<IP>]  => {
    const elementsRef = useRef(<></>)
    const valuesRef = useRef<InputsValues<IP>>({})

    useEffect(() => {
        let inputs = <></>
        for (const [key, {type, props}] of Object.entries(inputsProps)) {
            let input
            const setElementValue = (value: InputValue<typeof type>) => {
              valuesRef.current[key] = value
            }
            switch (type) {
                case "textInput":
                    input = <TextInput {...props} setValue={(value) => {setElementValue(value)}}/>
                    break
                case "numberInput":
                    input = <NumberInput {...props} setValue={(value) => {setElementValue(value)}}/>
                    break
                case "textAreaInput":
                    input = <TextAreaInput {...props} setValue={(value) => {setElementValue(value)}}/>
                    break
            }
            inputs = <>
                     {inputs}
                     {input}
                     </>
        }
        elementsRef.current = inputs
    }, [])

    return [elementsRef.current, valuesRef.current]
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
    position?: PositionCSS
    size?: SizeCSS
    resizable?: boolean
    draggable?: boolean
    hidable?: boolean
    inputsProps: IP
    buttonText: string
    submissionAction: (values: InputsValues<IP>) => Promise<ResultMessageProps>
}

export default function useFormModal<IP extends InputsProps>({
                                                      inputsProps,
                                                      buttonText,
                                                      submissionAction,
                                                      ... modalProps
                                                      }: UseFormModalProps<IP>) : [(visible: boolean) => void, JSX.Element] {
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

        submissionAction(inputsValues)
        .then((resultMessage) => {setResultMessage(resultMessage)})
        .finally(() => {setLoading(false)})
        .catch((e) => {})
    }

    const children = <FormContainer onSubmit={handleSubmission}>
                    {inputs}
                    <Button disabled={loading}>{buttonText}</Button>
                    <BlocksLoader show={loading}/>
                    <ResultMessage {...resultMessage}/>
                    </FormContainer>
    

    return useModal({children, handleOnHide,...modalProps})
}