import styled from "@emotion/styled"
import { DetailedHTMLProps, TextareaHTMLAttributes } from "react"
import { inputShareStyles } from "./TextInput"

export type TextAreaInputProps = {
    setValue: (value: string) => void
} & DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>

export const TextAreaInput = ({setValue, ...rest}: TextAreaInputProps) => {
    return (
        <TextArea {...rest} onChange={(e) => {setValue(e.target.value)}}/>
    )
}
const TextArea = styled.textarea`
    vertical-align: top;
    text-align: left;
    font-size: 20px;
    height: 100%;
    width: 100%;
    ${inputShareStyles}
`