import { FcPicture } from "react-icons/fc"
import { createImage } from "../../../../../utils/domManipulations"
import { InputsValues} from "../../../forms/useFormModal"
import { } from "../../useHtmlEditor"
import Option, { ShowFormModal } from "../Option"
import { optionAttributeTypePrefix } from "../useOptions"
import { ModifyInputsProps, UseOptionWithForm } from "./types"

const type = "image"

const inputsProps = [
  {type: "imageSelector"},
  {type: "numberInput"},
  {type: "numberInput"}
] as const

type InputsProps = typeof inputsProps
type ModifiableAttributes = {src: string, height: number, width: number}

const getModifyInputsProps = (image: HTMLImageElement) => {
  const modifyInputsProps = structuredClone(inputsProps) as unknown as ModifyInputsProps<InputsProps>
  modifyInputsProps[0]["props"] = {value: {dataUrl: image.src, name: "", extension: ""}}
  modifyInputsProps[1]["props"] = {value: image.height}
  modifyInputsProps[2]["props"] = {value: image.width}

  return modifyInputsProps 
}

const mapInputsValuesToAttrs = ([imageData, height=0, width=0]: InputsValues<InputsProps>) => ({src: imageData?.dataUrl ?? "", height, width})

type Props = {
}
const useImageOption: UseOptionWithForm<HTMLImageElement, ModifiableAttributes, InputsProps, Props> = function({setupFormModal, ...rest}) {
    const showFormModal: ShowFormModal<HTMLImageElement, ModifiableAttributes> = (modifyNewImage, finish) => {
      setupFormModal<InputsProps>(inputsProps, (inputsValues) => {modifyNewImage(mapInputsValuesToAttrs(inputsValues))}, finish)
    }

   /*  const onclick = (e: MouseEvent) => {
      const image = e.target as HTMLImageElement
      const {src, height, width} = image
      window.modifyElement<HTMLImageElement, InputsPropsValues>(image, getModifyInputsProps({src, height, width}))
    } */
    const getNewImage = () => {
      const image = createImage()
      image.dataset[optionAttributeTypePrefix] = type
      return image
    }
  
    const option = <Option getNewOptionNode={getNewImage} withText={false} insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                   <FcPicture size={30}/>
                   </Option>

    return {type, getModifyInputsProps, mapInputsValuesToAttrs, option}
}

export default useImageOption