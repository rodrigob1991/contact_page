import { css } from "@emotion/react"
import { ChangeEventHandler, MouseEventHandler, forwardRef, useEffect, useRef, useState } from "react"
import { getContainedString } from "utils/src/strings"
import { Button } from "../Buttons"
import styled from "@emotion/styled"

export type ImageData = {name: string, extension: string, dataUrl: string}
export type ProcessSelectedImage = (args: ImageData) => void
export type ImageSelectorProps = {
    processSelectedImage: ProcessSelectedImage
    buttonText?: string
    imageMaxSize?: number
    disabled?: boolean
    value?: ImageData
}
const ImageSelector = forwardRef<HTMLButtonElement, ImageSelectorProps>(({processSelectedImage, buttonText="choose image", imageMaxSize=5, disabled = false, value}, ref) => {
    const [imageData, setImageData] = useState(value)
    useEffect(() => {
        setImageData(value)
    }, [value?.name, value?.extension])

    const inputFileRef = useRef<HTMLInputElement>(null)

    const [imageSizeErrorStr, setImageSizeErrorStr] = useState("")

    const handleClickChooseImage: MouseEventHandler<HTMLButtonElement> = (e) => {
        setImageSizeErrorStr("")
        inputFileRef.current?.click()
    }
    const handleImageSelection: ChangeEventHandler<HTMLInputElement> = (e) => {
        const image = e.target.files?.item(0)
        if (image) {
            if (image.size / 10 ** 6 > imageMaxSize) {
                setImageSizeErrorStr(`image cannot exceed ${imageMaxSize} megabytes`)
            } else {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const imageDataUrl = reader.result as string
                    if (imageDataUrl) {
                        const imageData = {name: image.name, extension: getContainedString(image.type, "/"), dataUrl: imageDataUrl}
                        processSelectedImage(imageData)
                        setImageData(imageData)
                    }
                }
                reader.readAsDataURL(image)
            }
        }
    }

    return <Container>
           <input ref={inputFileRef} onChange={handleImageSelection} style={{display: "none"}} type={"file"} accept={"image/*"}/>
           <Button ref={ref} onClick={handleClickChooseImage} disabled={disabled}>
           {buttonText}
           </Button>
           {imageData && <label>{imageData.name + "." + imageData.extension}</label>}
           {imageSizeErrorStr && <label css={imageSizeErrorLabelCss}>{imageSizeErrorStr}</label>}
           </Container>
})
const Container = styled.div`
 display: flex;
 flex-direction: row;
 gap: 10;
 cursor: pointer;
`
const imageSizeErrorLabelCss = css`
  font-weight: bold;
  font-size: 15px;
  color: red;
`

export default ImageSelector