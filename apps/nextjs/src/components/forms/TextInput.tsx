import { css } from "@emotion/react"
import styled from "@emotion/styled"
import { DetailedHTMLProps, InputHTMLAttributes, forwardRef, Ref } from "react"
import { mainColor } from "../../theme"

export type TextInputProps = {
    setValue: (value: string) => void
    fromSpan?: boolean
    email?: boolean
    onEnter?: () => void
    onEscape?: () => void
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>,HTMLInputElement>

export const TextInput = forwardRef(({value, setValue, fromSpan=false, email, onEnter, onEscape, ...rest}: TextInputProps, ref : Ref<HTMLInputElement>) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key.toLowerCase()) {
            case "enter" :
                if (onEnter) {
                    onEnter()
                    e.preventDefault()
                }
                break
            case "escape" :
                if (onEscape) {
                    onEscape()
                    e.preventDefault()
                }
                break
        }
    }
// TODO:  add placeholder to span variety
    return ( fromSpan ? <SpanInput ref={ref} {...rest} contentEditable onInput={(e) => {setValue((e.target as HTMLSpanElement).innerText)}} onKeyDown={handleKeyDown}/>
                      : <Input ref={ref} value={value} {...rest} type={email ? "email" : "text"} 
                               onInput={(e) => { setValue((e.target as HTMLInputElement).value) }}
                               onKeyDown={handleKeyDown}
                        />
    )
})
TextInput.displayName = "TextInput"

export const inputShareStyles = css`
    font-size: 20px;
    border-style: solid;
    border-width: medium;
    border-color: ${mainColor};
    border-radius: 10px; 
    font-weight: bold;
    padding: 8px; 
    width: 100%;
`
export const Input = styled.input`
    ${inputShareStyles}
`
const SpanInput = styled.span`
    ${inputShareStyles}
    display: inline-block;
    text-align: start;
    background-color: white;
    cursor: text;
    overflow: hidden;
    white-space: nowrap;
`