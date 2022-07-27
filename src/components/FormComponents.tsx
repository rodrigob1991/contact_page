import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {ChangeEvent, useEffect, useId, useRef, useState} from "react"
import {IoMdClose} from "react-icons/io"
import {Button} from "./Buttons"
import {ResultMessage, ResultMessageProps} from "./Labels"

type TextInputProps = {
    value?: string
    setValue: (value: string) => void
    width?: number
    height?: number
    placeholder?: string
}

export const TextInput = ({
                              value,
                              setValue,
                              width,
                              height,
                              placeholder
                          }: TextInputProps) => {

    return (
        <Input placeholder={placeholder} width={width} height={height} value={value} type={"text"}
               onChange={(e) => setValue(e.target.value)}/>
    )
}
const Input = styled.input`
    font-size: 20px;
    ${props =>
    css`
      height:${props.height}px;
      width:${props.width}px;
    `}
`

type TextAreaInputProps = {
    value?: string
    setValue: (value: string) => void
    width?: number
    height?: number
    placeholder?: string
}

export const TextAreaInput = ({
                                  value,
                                  setValue,
                                  width,
                                  height,
                                  placeholder
                              }: TextAreaInputProps) => {
    return (
        <TextArea placeholder={placeholder} width={width} height={height} value={value} onChange={(e) => setValue(e.target.value)}/>
    )
}
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

type ImageSelectorProps = {
    imageDataUrl?: string
    processImage?: (imageDataUrl: string)=> void
    imageMaxSize: number
    width: number
    height: number
}

export const ImageSelector = ({processImage,imageDataUrl: imageDataUrlProp , imageMaxSize, width, height}: ImageSelectorProps) => {
    const id = useId()
    const inputFileRef = useRef<HTMLInputElement>(null)

    const [imageSizeErrorStr, setImageSizeErrorStr] = useState("")
    const [imageDataUrl, setImageDataUrl] = useState(imageDataUrlProp)

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
                        console.log(imageDataUrl)
                        setImageDataUrl(imageDataUrl)
                        if (processImage) {
                            processImage(imageDataUrl)
                        }
                    }
                }
                reader.readAsDataURL(image)
            }
        }
    }

    return (
        <ImageSelectorContainer>
            <input id={id + "input"} ref={inputFileRef} onChange={handleImageSelection} style={{display: "none"}}
                   type={"file"} accept={"image/*"}/>
            <img onClick={goChooseImage} src={imageDataUrl} width={width} height={height} style={{cursor: "pointer"}}/>
            <ImageSizeErrorLabel id={id + "label"}> {imageSizeErrorStr} </ImageSizeErrorLabel>
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

type InputType = "textAreaInput" | "textInput"
type InputElementProps = {type: InputType, placeholder: string, height: number, width: number}
type InputElementsProps = { [key: string]: InputElementProps }
type InputValues<E extends InputElementsProps> = {
    [K in keyof E]: (E[K]["type"] extends ("textInput" | "textAreaInput") ? string : never)
}

type FormModalProps<E extends InputElementsProps> = {
    inputElementsProps: E
    processSubmission: (values: InputValues<E>) => Promise<ResultMessageProps>
    position: {top: number, left: number}
    buttonText : string
}
const useElementsValues = <E extends InputElementsProps>(inputElementsProps: E) : [JSX.Element, InputValues<E>]  => {
    const elementsValues = useRef(
        (() => {
            const initElementsValues: Record<string, any> = {}
            for (const key in inputElementsProps) {
                initElementsValues[key] = undefined
            }
            return initElementsValues as InputValues<E>
        })())
    const setElementValue = (key: keyof InputValues<E>, value: any) => {
        elementsValues.current[key] = value
    }

    const elementsRef = useRef(<></>)
    useEffect(() => {
        let elements = <></>
        for (const [key, {type, ...rest}] of Object.entries(inputElementsProps)) {
            let element
            switch (type) {
                case "textInput":
                    element = <TextInput {...rest} setValue={(value) => setElementValue(key, value)}/>
                    break
                case "textAreaInput":
                    element = <TextAreaInput {...rest} setValue={(value) => setElementValue(key, value)}/>
                    break
            }
            elements = <>
                {elements}
                {element}
            </>
        }
        elementsRef.current = elements
    }, [])
    return [elementsRef.current, elementsValues.current]
}

export const useFormModal = <E extends InputElementsProps>({
                                                               inputElementsProps,
                                                               processSubmission,
                                                               position: {
                                                                   top: topPosition,
                                                                   left: leftPosition
                                                               },
                                                               buttonText
                                                           }: FormModalProps<E>) : [()=> void, JSX.Element] => {
    const [Elements, elementsValues] = useElementsValues(inputElementsProps)
    const [show, setShow] = useState(false)
    const showModal = () => {
        setShow(true)
    }
    const hideModal = () => {
        setShow(false)
    }
    const [resultMessage, setResultMessage] = useState({succeed: false, message: ""})
    const handleSubmission = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        processSubmission(elementsValues).then(
            (resultMessageProps)=> {
                setResultMessage(resultMessageProps)
            }
        )
    }

    const Modal = <FormModalContainer onSubmit={handleSubmission} show={show} topPosition={topPosition}
                            leftPosition={leftPosition}>
                    <IoMdClose style={{cursor: "pointer", color: "#FFFFFF"}} onClick={(e) => hideModal()}/>
                    {Elements}
                    <Button backgroundColor={"#00008B"}>{buttonText}</Button>
                    <ResultMessage {...resultMessage}/>
                 </FormModalContainer>

    return [showModal, Modal]
}
const FormModalContainer = styled.form<{ show: boolean, topPosition: number, leftPosition: number}>`
  display: ${({show, topPosition, leftPosition}) => (show ? "flex" : "none") + ";"
    + "top: " + topPosition + "%;"
    + "left: " + leftPosition + "%;"}
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

