import styled from "@emotion/styled"
import { inputShareStyles } from "./TextInput"
import { forwardRef } from "react"

export type TextAreaInputProps = {
    value?: string
    setValue: (value: string) => void
    required?: boolean
} 

const TextAreaInput = forwardRef<HTMLTextAreaElement, TextAreaInputProps>(({value, setValue, ...rest} , ref) => {
    return <TextArea ref={ref} value={value} onChange={(e) => {setValue(e.target.value)}} {...rest}/>
})
const TextArea = styled.textarea`
    vertical-align: top;
    text-align: left;
    font-size: 20px;
    height: 100%;
    width: 100%;
    ${inputShareStyles}
`

export default TextAreaInput