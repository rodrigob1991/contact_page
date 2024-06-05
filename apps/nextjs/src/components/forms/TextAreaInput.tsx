import styled from "@emotion/styled"
import { inputShareStyles } from "./TextInput"

export type TextAreaInputProps = {
    value?: string
    setValue: (value: string) => void
    required: boolean
} 

export const TextAreaInput = ({value, setValue, ...rest}: TextAreaInputProps) => {
    return (
        <TextArea value={value} onChange={(e) => {setValue(e.target.value)}} {...rest}/>
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