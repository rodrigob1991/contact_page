import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {ChangeEvent, useId, useRef, useState} from "react"

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
    processImage?: (imageDataUrl: string)=> void
    imageMaxSize: number
    width: number
    height: number
}

export const ImageSelector = ({processImage, imageMaxSize, width, height}: ImageSelectorProps) => {
    const id = useId()
    const inputFileRef = useRef<HTMLInputElement>(null)

    const [imageSizeErrorStr, setImageSizeErrorStr] = useState("")
    const [imageUrl, setImageUrl] = useState("")

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
                    if(imageDataUrl) {
                        setImageUrl(imageDataUrl)
                        if(processImage) {
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
            <img onClick={goChooseImage} src={imageUrl}  width={width} height={height} style={{cursor: "pointer"}}/>
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


