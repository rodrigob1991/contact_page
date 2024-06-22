import { FcPicture } from "react-icons/fc"
import { createImage } from "../../../../../utils/domManipulations"
import { InputsValues } from "../../../forms/useFormModal"
import { } from "../../useHtmlEditor"
import Option, { ShowFormModal } from "../Option"
import { optionAttributeTypePrefix } from "../useOptions"
import { ModifyInputsProps, UseOptionWithForm } from "./types"

const imageOptionType = "image"

const inputsProps = [
  {type: "imageSelector"},
  {type: "numberInput"},
  {type: "numberInput"}
]  as const
type InputsProps = typeof inputsProps

const getImageModifyInputsProps = (image: HTMLImageElement) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsProps<InputsProps>
  modifyInputsProps[0].props.value = {dataUrl: image.src, name: "", extension: ""}
  modifyInputsProps[1].props.value = image.height
  modifyInputsProps[2].props.value = image.width

  return modifyInputsProps
}

const mapImageInputsValuesToAttrs = ([{dataUrl}, height, width]: InputsValues<InputsProps>) => ({src: dataUrl, height, width})

type Props = {
}
const useImageOption: UseOptionWithForm<HTMLImageElement, InputsProps, "image", Props> = function({setupFormModal, ...rest}) {
    const showFormModal: ShowFormModal<HTMLImageElement, {src: string, height: number, width: number}> = (modifyNewImage, finish) => {
      setupFormModal<InputsProps>(inputsProps, (inputsValues) => {modifyNewImage(mapImageInputsValuesToAttrs(inputsValues))}, finish)
    }

   /*  const onclick = (e: MouseEvent) => {
      const image = e.target as HTMLImageElement
      const {src, height, width} = image
      window.modifyElement<HTMLImageElement, InputsPropsValues>(image, getModifyInputsProps({src, height, width}))
    } */
    const getNewImage = () => {
      const image = createImage()
      image.dataset[optionAttributeTypePrefix] = imageOptionType
      return image
    }
  
    const imageOption = <Option getNewOptionNode={getNewImage} withText={false} insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                        <FcPicture size={30}/>
                        </Option>

    return {imageOptionType, getImageModifyInputsProps, mapImageInputsValuesToAttrs, imageOption}
}

export default useImageOption