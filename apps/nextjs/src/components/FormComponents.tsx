import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {
    ChangeEvent, CSSProperties,
    DetailedHTMLProps,
    forwardRef,
    ImgHTMLAttributes,
    InputHTMLAttributes,
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

type TextInputProps = {
    setValue: (value: string) => void
    email?: boolean
    onEnter?: () => void
    onEscape?: () => void
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>,HTMLInputElement>
export const TextInput = forwardRef(({setValue, email, onEnter, onEscape, ...rest}: TextInputProps, ref : Ref<HTMLInputElement>) => {
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

    return (
        <Input {...rest} type={email ? "email" : "text"} ref={ref}
               onChange={(e) => setValue(e.target.value)}
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
               onChange={(e) => setValue(Number(e.target.value))}
               onKeyDown={handleKeyDown}
        />
    )
})
NumberInput.displayName = "NumberInput"

const Input = styled.input`
    font-size: 20px;
`

type TextAreaInputProps = {
    setValue: (value: string) => void
} & DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
export const TextAreaInput = ({setValue, ...rest}: TextAreaInputProps) => {
    return (
        <TextArea {...rest} onChange={(e) => setValue(e.target.value)}/>
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

type InputType = "textAreaInput" | "textInput" | "textInputEmail"
type InputElementProps = {type: InputType}
type InputElementsProps = { [key: string]: InputElementProps }
type InputValues<E extends InputElementsProps> = {
    [K in keyof E]: (E[K]["type"] extends ("textInput" | "textAreaInput" | "textInputEmail") ? string : never)
}

type FormModalProps<E extends InputElementsProps> = {
    position: {top: number, left: number}
    inputElementsProps: E
    button: {text: string, style?: CSSProperties}
    resultMessageStyle?: CSSProperties
    processSubmission: (values: InputValues<E>) => Promise<ResultMessageProps>
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
                case "textInputEmail":
                    element = <TextInput {...rest} email setValue={(value) => setElementValue(key, value)}/>
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
                                                               position: {
                                                                   top: topPosition,
                                                                   left: leftPosition
                                                               },
                                                               inputElementsProps,
                                                               button: {text: buttonText, style: buttonStyle},
                                                               resultMessageStyle,
                                                               processSubmission,
                                                           }: FormModalProps<E>) : [()=> void, JSX.Element] => {
    const [Elements, elementsValues] = useElementsValues(inputElementsProps)

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

    const handleCloseModal = (e: React.MouseEvent<SVGElement>) => {
        cleanResultMessage()
        hideModal()
    }

    const handleSubmission = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        cleanResultMessage()
        setLoading(true)

        processSubmission(elementsValues)
            .then(
            (resultMessageProps)=> {
                setResultMessage(resultMessageProps)
            })
            .finally(()=>  setLoading(false))
    }

    const Modal = <FormModalContainer onSubmit={handleSubmission} show={show} topPosition={topPosition}
                            leftPosition={leftPosition}>
                    <IoMdClose size={20} style={{cursor: "pointer", color: "#FFFFFF"}} onClick={handleCloseModal}/>
                    {Elements}
                    <BlocksLoader show={loading}/>
                    <Button disabled={loading} style={buttonStyle} backgroundColor={"#00008B"}>{buttonText}</Button>
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
