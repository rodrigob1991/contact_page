import styled from "@emotion/styled"
import {css} from "@emotion/react"

export const TextInput = ({
                              value,
                              setValue,
                              width,
                              placeholder
                          }: { value: string, setValue: (value: string) => void, width: number, placeholder? : string }) => {
    return (
        <Input placeholder={placeholder} width={width} value={value} type={"text"} onChange={(e) => setValue(e.target.value)}/>
    )
}

export const TextAreaInput = ({
                                  value,
                                  setValue,
                                  width,
                                  height,
                                  placeholder
                              }: { value: string, setValue: (value: string) => void, width: number, height: number, placeholder?: string }) => {
    return (
        <TextArea placeholder={placeholder} width={width} height={height} value={value} onChange={(e) => setValue(e.target.value)}/>
    )
}

const Input = styled.input`
    height:40px;
    width:600px;
    font-size: 20px;
    ${props =>
    css`
      height:${props.height}px;
      width:${props.width}px;
    `}
    `
const TextArea = styled.textarea<{ height?: number, width?: number }>`
    vertical-align: top;
    text-align: left;
    font-size: 20px;
    ${props =>
    css`
      height:${props.height}px;
      width:${props.width}px;
    `}
    `