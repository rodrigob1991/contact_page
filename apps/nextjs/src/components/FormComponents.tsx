import { css } from "@emotion/react"
import styled from "@emotion/styled"
import React, {
    ChangeEvent,
    DetailedHTMLProps,
    forwardRef,
    ImgHTMLAttributes,
    InputHTMLAttributes,
    Ref,
    TextareaHTMLAttributes,
    useRef,
    useState
} from "react"
import { getContainedString } from "utils/src/strings"

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
