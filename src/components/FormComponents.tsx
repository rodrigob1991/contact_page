import styled from "@emotion/styled"
import {css} from "@emotion/react"
import React, {
    ChangeEvent,
    InputHTMLAttributes,
    TextareaHTMLAttributes,
    useEffect,
    useId,
    useRef,
    useState
} from "react"
import {IoMdClose} from "react-icons/io"
import {Button} from "./Buttons"
import {ResultMessage, ResultMessageProps} from "./Labels"
import {BlocksLoader} from "./Loaders"

type TextInputProps = {
    setValue: (value: string) => void
    email?: boolean
}

export const TextInput = ({
                              setValue,
                              email,
                              ...rest
                          }: TextInputProps & InputHTMLAttributes<HTMLInputElement>) => {

    return (
        <Input {...rest}
               type={email ? "email" : "text"}
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
    setValue: (value: string) => void
}

export const TextAreaInput = ({
                                  setValue,
                                    ...rest
                              }: TextAreaInputProps & TextareaHTMLAttributes<HTMLTextAreaElement>) => {
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
    options: E[]
    fontSize?: number
    color?: string
}
export const OptionSelector = <E extends string>({options, fontSize, color}: OptionSelectorProps<E>) => {
    const styles = {fontSize: fontSize || 15, color: color || "black"}

    const [selectedOption, setSelectedOption] = useState(options[0])
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
            <DropDownLabel {...styles} onClick={handleOpenMenu}>{selectedOption}</DropDownLabel>
            <DropDownMenu show={show}>
               {options.map((o) => <DropDownMenuOption className={"selectorOption"} key={o} {...styles} onClick={e => handleSelection(o)}> {o}
                                       </DropDownMenuOption>)
                }
            </DropDownMenu>
        </DropDown>
    )
}
const DropDown = styled.div`
  position: relative;
`
const DropDownLabel = styled.label<{fontSize: number}>`
${({fontSize, color})=> 
    `font-size: ${fontSize}px; 
     color: ${color};`}
  font-weight: bold;
  cursor: pointer;
  z-index: -1;
`
const DropDownMenuOption = styled.div<{fontSize: number}>`
${({fontSize, color})=>
    `font-size: ${fontSize}px; 
     color: ${color};`}
  font-weight: bold;
  padding: .45rem;
  cursor: pointer;
  border-left: 2px solid;
  border-right: 2px solid;
  border-top: 2px solid;
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

type InputType = "textAreaInput" | "textInput" | "textInputEmail"
type InputElementProps = {type: InputType, placeholder: string, height: number, width: number}
type InputElementsProps = { [key: string]: InputElementProps }
type InputValues<E extends InputElementsProps> = {
    [K in keyof E]: (E[K]["type"] extends ("textInput" | "textAreaInput" | "textInputEmail") ? string : never)
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
                    <IoMdClose style={{cursor: "pointer", color: "#FFFFFF"}} onClick={handleCloseModal}/>
                    {Elements}
                    <BlocksLoader show={loading}/>
                    <Button disabled={loading} backgroundColor={"#00008B"}>{buttonText}</Button>
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

