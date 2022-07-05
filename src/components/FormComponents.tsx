import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {ChangeEvent, useId, useRef, useState} from "react"
import {Button} from "./Buttons"

export const TextInput = ({
                              value,
                              setValue,
                              width,
                              placeholder
                          }: { value: string, setValue: (value: string) => void, width: number, placeholder?: string }) => {

    return (
        <Input placeholder={placeholder} width={width} value={value} type={"text"}
               onChange={(e) => setValue(e.target.value)}/>
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

type TextAreaInputProps = {
    value: string
    setValue: (value: string) => void
    width: number
    height: number
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
    processNewImage: (file: File)=> void
    imageMaxSize: number
}

export const ImageSelector = ({processNewImage, imageMaxSize}: ImageSelectorProps) => {
    const id = useId()
    const inputFileRef = useRef<HTMLInputElement>(null)

    const [imageSizeErrorStr, setImageSizeErrorStr] = useState("")

    const onChooseImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        setImageSizeErrorStr("")
        inputFileRef.current?.click()
    }
    const handleImageSelection = (e: ChangeEvent<HTMLInputElement>) => {
        const image = e.target.files?.item(0)
        if (image) {
            if (image.size / 10 ** 6 > imageMaxSize) {
                e.preventDefault()
                setImageSizeErrorStr(`image cannot exceed ${imageMaxSize} megabytes`)
            } else {
                processNewImage(image)
            }
        }
    }

    return (
        <ImageSelectorContainer>
            <input id={id + "input"} ref={inputFileRef} onChange={handleImageSelection} style={{display: "none"}}
                   type={"file"} accept={"image/*"}/>
            <Button id={id + "button"} onClick={onChooseImage}> put image</Button>
            <ImageSizeErrorLabel id={id + "label"}> {imageSizeErrorStr} </ImageSizeErrorLabel>
        </ImageSelectorContainer>
    )
}
const ImageSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #00008B;
`
const ImageSizeErrorLabel = styled.label`
  font-weight: bold;
  font-size: 15px;
  color: red;
`
type TextAreaWithImagesProps =
    ImageSelectorProps & TextAreaInputProps & {
    processRemovedImage: (image: File)=> void
}

export const TextAreaWithImages = ({processRemovedImage, ...rest}: TextAreaWithImagesProps) => {
    const {processNewImage, imageMaxSize, ...textAreaProps} = rest

    return (
        <TextAreaWithImagesContainer>
            <TextAreaInput {...textAreaProps}/>
            <ImageSelector processNewImage={processNewImage} imageMaxSize={imageMaxSize}/>
        </TextAreaWithImagesContainer>
    )

}

const TextAreaWithImagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  background-color: #00008B;
`


