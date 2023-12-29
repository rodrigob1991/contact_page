import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {
    ChangeEvent, CSSProperties,
    DetailedHTMLProps,
    FormEventHandler,
    forwardRef,
    ImgHTMLAttributes,
    InputHTMLAttributes,
    MouseEventHandler,
    Ref,
    TextareaHTMLAttributes,
    useEffect,
    useRef,
    useState
} from "react"
import {IoMdClose} from "react-icons/io"
import {Button} from "./Buttons"
import {ResultMessage, ResultMessageProps} from "./Labels"
import {BlocksLoader} from "./Loaders"
import {getContainedString} from "utils/src/strings"
import { maxWidthSmallestLayout } from "../layouts"
import { secondColor } from "../theme"

type TextInputProps = {
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

type NumberInputProps = {
    setValue: (value: number) => void
    onEnter?: () => void
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>,HTMLInputElement>
export const NumberInput = forwardRef(({
                                         setValue,
                                         onEnter,
                                         ...rest
                                     }: NumberInputProps, ref : Ref<HTMLInputElement>) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key.toLowerCase()) {
            case "enter" :
                if (onEnter)
                    onEnter()
                e.preventDefault()
                break
        }
    }

    return (
        <Input {...rest} type={"number"} ref={ref}
               onChange={(e) => {setValue(Number(e.target.value))}}
               onKeyDown={handleKeyDown}
        />
    )
})
NumberInput.displayName = "NumberInput"

const inputShareStyles = css`
    font-size: 20px;
    border-style: solid;
    border-width: medium;
    border-color: black;
    border-radius: 10px; 
    font-weight: bold;
    padding: 8px; 
    width: 100%;
`
const Input = styled.input`
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

type TextAreaInputProps = {
    setValue: (value: string) => void
} & DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
export const TextAreaInput = ({setValue, ...rest}: TextAreaInputProps) => {
    return (
        <TextArea {...rest} onChange={(e) => {setValue(e.target.value)}}/>
    )
}
const TextArea = styled.textarea<{ height?: number, width?: number }>`
    vertical-align: top;
    text-align: left;
    font-size: 20px;
    height: 100%;
    width: 100%;
`
type OptionSelectorProps<E extends string> = {
    id?: string
    processRefToValueHtmlElement?: (e: HTMLElement) => void
    options: E[]
    initSelectedOption?: E
    fontSize?: string
    color?: string
}
export const OptionSelector = <E extends string>({id, processRefToValueHtmlElement, options, initSelectedOption, fontSize, color}: OptionSelectorProps<E>) => {
    const styles = {fontSize: fontSize || "15px", color: color || "black"}

    const [selectedOption, setSelectedOption] = useState(initSelectedOption || options[0])
    const [show, setShow] = useState(false)

    const handleSelection = (option: E) => {

        setSelectedOption(option)
        setShow(false)
    }
    const handleOpenMenu = (e: React.MouseEvent<HTMLLabelElement>) => {
        setShow(!show)
    }

    return (
        <DropDown>
            <DropDownValue id={id} ref={processRefToValueHtmlElement ? r => {if(r) processRefToValueHtmlElement(r) } : undefined} {...styles} onClick={handleOpenMenu}>{selectedOption}</DropDownValue>
            <DropDownMenu show={show}>
               {options.map((o) => <DropDownMenuOption key={o} {...styles} onClick={e => handleSelection(o)}> {o}
                                       </DropDownMenuOption>)
                }
            </DropDownMenu>
        </DropDown>
    )
}
const DropDown = styled.div`
  position: relative;
`
const DropDownValue = styled.span<{fontSize: string}>`
${({fontSize, color})=> 
    `font-size: ${fontSize}; 
     color: ${color};`}
  font-weight: bold;
  cursor: pointer;
  z-index: -1;
`
const DropDownMenuOption = styled.div<{fontSize: string}>`
${({fontSize, color})=>
    `font-size: ${fontSize}; 
     color: ${color};`}
  font-weight: bold;
  padding: .45rem;
  cursor: pointer;
  border-left: 2px solid;
  border-right: 2px solid;
  border-top: 2px solid;
  :last-child {
    border-bottom: 2px solid;
    }
`
const DropDownMenu = styled.div<{ show: boolean }>`
  position: absolute;
  left: 0;
  top: calc(100% + .25rem);
  background-color: white;
  z-index: 1;
  border-radius: .25rem;
  box-shadow: 0 2px 5px 0 rgba(0,0,0,.1);
  ${({show}) => show ?
    `display: block;
    transform: translateY(0);` :
    `display: none;
    transform: translateY(-10px);`}
  transition: display 150ms ease-in-out, transform 150ms ease-in-out;
`

export type ProcessSelectedImage = (name: string, extension: string, dataUrl: string) => void
type ImageSelectorProps = {
    processSelectedImage?: ProcessSelectedImage
    label: JSX.Element
    imageMaxSize: number
    disabled?: boolean
}
export const ImageSelector = ({processSelectedImage, label, imageMaxSize, disabled = false}: ImageSelectorProps) => {
    const inputFileRef = useRef<HTMLInputElement>(null)

    const [imageSizeErrorStr, setImageSizeErrorStr] = useState("")

    const goChooseImage = (e: React.MouseEvent<HTMLImageElement>) => {
        setImageSizeErrorStr("")
        inputFileRef.current?.click()
    }
    const handleImageSelection = (e: ChangeEvent<HTMLInputElement>) => {
        const image = e.target.files?.item(0)
        if (image) {
            if (image.size / 10 ** 6 > imageMaxSize) {
                setImageSizeErrorStr(`image cannot exceed ${imageMaxSize} megabytes`)
            } else {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const imageDataUrl = reader.result as string
                    if (imageDataUrl) {
                        if (processSelectedImage) {
                            processSelectedImage(image.name, getContainedString(image.type, "/"), imageDataUrl)
                        }
                    }
                }
                reader.readAsDataURL(image)
            }
        }
    }

    return (
        <div tabIndex={0} style={{cursor: "pointer"}}>
            <input ref={inputFileRef} onChange={handleImageSelection} style={{display: "none"}}
                   type={"file"} accept={"image/*"}/>
            <div onClick={goChooseImage}
                // @ts-ignore
                 disabled={disabled}>
                {label}
            </div>
            <ImageSizeErrorLabel> {imageSizeErrorStr} </ImageSizeErrorLabel>
        </div>
    )
}


type ImageViewSelectorProps = {
    processSelectedImage?: ProcessSelectedImage
    imageMaxSize: number
    description?: string
} & DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>,HTMLImageElement>

export const ImageViewSelector = ({processSelectedImage, imageMaxSize, description, ...rest}: ImageViewSelectorProps) => {
    const [imageDataUrl, setImageDataUrl] = useState(rest.src)

    const [hoveringImage, setHoveringImage] = useState(false)
    const [hoveringDescription, setHoveringDescription] = useState(false)
    const handleOnMouseEnter = () => {
        setHoveringImage(true)
    }
    const handleOnMouseLeave = () => {
        setHoveringImage(false)
    }
    const handleOnMouseEnterDescription = () => {
        setHoveringDescription(true)
    }
    const handleOnMouseLeaveDescription = () => {
        setHoveringDescription(false)
    }

    return (
        <ImageSelectorContainer>
            <ImageSelector processSelectedImage={(name, extension, src)=> {setImageDataUrl(src); if (processSelectedImage) {processSelectedImage(name, extension, src)}}}
                           label={<>{description && <ImageDescription onMouseEnter={handleOnMouseEnterDescription} onMouseLeave={handleOnMouseLeaveDescription} show={hoveringImage || hoveringDescription}>{description}</ImageDescription>}
                               <img {...rest} src={imageDataUrl} onMouseEnter={handleOnMouseEnter} onMouseLeave={handleOnMouseLeave}/>
                           </>} imageMaxSize={imageMaxSize}/>
        </ImageSelectorContainer>
    )
}
const ImageSelectorContainer = styled.div`
  display: flex;
`
const ImageSizeErrorLabel = styled.label`
  font-weight: bold;
  font-size: 15px;
  color: red;
`
const ImageDescription = styled.div<{show: boolean}>`
  display: ${({show})=> show ? "block" : "none"};
  position: absolute;
  z-index: 1;
  background-color: white;
  color: #778899;
  font-weight: bold;
  font-size: 10px;
  border-style: solid;
  border-color: #778899;
  border-width: thin;
  padding: 1.5px;
`

type InputType = "textAreaInput" | "textInput" | "numberInput" | "textInputEmail"
type InputProps = {type: InputType}
type InputsProps = { [key: string]: InputProps }
type InputValue<IT extends InputType> =  (IT extends ("textInput" | "textAreaInput" | "textInputEmail") ? string : never) | (IT extends "numberInput" ? number : never)
type InputsValues<E extends InputsProps> = {
    [K in keyof E]: E[K]["type"] extends ("textInput" | "textAreaInput" | "textInputEmail") ? string : E[K]["type"] extends "numberInput" ? number :  never
}

type FormModalProps<IP extends InputsProps> = {
    position: {top: number, left: number}
    inputsProps: IP
    button: {text: string, style?: CSSProperties}
    resultMessageStyle?: CSSProperties
    processSubmission: (values: InputsValues<IP>) => Promise<ResultMessageProps>
}
const useElementsValues = <IP extends InputsProps>(inputsProps: IP) : [JSX.Element, InputsValues<IP>]  => {
    /* const elementsValues = useRef(
        (() => {
            const initElementsValues: Record<string, any> = {}
            for (const key in inputElementsProps) {
                initElementsValues[key] = undefined
            }
            return initElementsValues as InputValues<E>
        })())
    const setElementValue = (key: keyof InputValues<E>, value: any) => {
        elementsValues.current[key] = value
    } */

    const elementsRef = useRef(<></>)
    const valuesRef = useRef<InputsValues<IP>>({})
    useEffect(() => {
        let elements = <></>
        for (const [key, {type, ...rest}] of Object.entries(inputsProps)) {
            let element
            const setElementValue = (value: InputValue<typeof type>) => {
              valuesRef.current[key] = value
            }
            switch (type) {
                case "textInput":
                    element = <TextInput {...rest} setValue={(value) => {setElementValue(value)}}/>
                    break
                case "textInputEmail":
                    element = <TextInput {...rest} email setValue={(value) => {setElementValue(value)}}/>
                    break
                case "textAreaInput":
                    element = <TextAreaInput {...rest} setValue={(value) => {setElementValue(value)}}/>
                    break
            }
            elements = <>
                      {elements}
                      {element}
                       </>
        }
        elementsRef.current = elements
    }, [])
    return [elementsRef.current, valuesRef.current]
}

export const useFormModal = <IP extends InputsProps>({position,
                                                      inputsProps,
                                                      button: {text: buttonText, style: buttonStyle},
                                                      resultMessageStyle,
                                                      processSubmission,
                                                      }: FormModalProps<IP>) : [()=> void, JSX.Element] => {
    const [inputs, inputsValues] = useElementsValues(inputsProps)

    const [show, setShow] = useState(false)
    const showModal = () => {
        setShow(true)
    }
    const hideModal = () => {
        setShow(false)
    }

    const [loading, setLoading] = useState(false)

    const emptyResultMessage = {succeed: false, message: ""}
    const [resultMessage, setResultMessage] = useState(emptyResultMessage)
    const cleanResultMessage = () => {
        setResultMessage(emptyResultMessage)
    }

    const handleCloseModal: MouseEventHandler = (e) => {
        cleanResultMessage()
        hideModal()
    }

    const handleSubmission: FormEventHandler = (e) => {
        e.preventDefault()
        cleanResultMessage()
        setLoading(true)

        processSubmission(inputsValues)
        .then((resultMessageProps) => {
                setResultMessage(resultMessageProps)
        })
        .finally(() => {setLoading(false)})
        .catch((e) => {})
    }

    const modal = <FormModalContainer onSubmit={handleSubmission} show={show} {...position}>
                    <IoMdClose size={20} style={{cursor: "pointer", color: "#FFFFFF"}} onClick={handleCloseModal}/>
                    {inputs}
                    <BlocksLoader show={loading}/>
                    <Button disabled={loading} style={buttonStyle} backgroundColor={secondColor}>{buttonText}</Button>
                    <ResultMessage {...resultMessage}/>
                  </FormModalContainer>

    return [showModal, modal]
}
const FormModalContainer = styled.form<{ show: boolean, top: number, left: number}>`
  display: ${({show, top, left}) => (show ? "flex" : "none") + ";"
    + "top: " + top + "%;"
    + "left: " + left+ "%;"}
  flex-direction: column;
  align-items: center;
  z-index: 1; 
  position: fixed;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 15px;
  gap: 15px;
  overflow: auto; 
  background-color: rgb(0,0,0); 
  background-color: rgba(0,0,0,0.4);
 `

