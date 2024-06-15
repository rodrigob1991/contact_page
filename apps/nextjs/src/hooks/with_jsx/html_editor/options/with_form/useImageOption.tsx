import { FcPicture } from "react-icons/fc"
import { ImageData } from "../../../../../components/forms/ImageSelector"
import { createImage } from "../../../../../utils/domManipulations"
import { } from "../../useHtmlEditor"
import Option, { ShowFormModal } from "../Option"
import { ModifyInputsPropsOptionNode, UseOptionWithForm } from "./types"

const inputsProps = {
  imageData: {type: "imageSelector"},
  height: {type: "numberInput"},
  width: {type: "numberInput"},
} as const
type InputsProps = typeof inputsProps
type AttributesToAsk = {src: string, height: number, width: number}

const getModifyInputsProps = (attr: AttributesToAsk) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsPropsOptionNode<HTMLImageElement, InputsProps>
  modifyInputsProps.imageData.props.value = {dataUrl: attr.src, name: "", extension: ""}
  modifyInputsProps.height.props.value = attr.height
  modifyInputsProps.width.props.value = attr.width

  return modifyInputsProps
}

type Props = {
}
const useImageOption: UseOptionWithForm<Props, "image"> = function({setupFormModal, ...rest}) {
    const showFormModal: ShowFormModal<HTMLImageElement, {src: string, height: number, width: number}> = (modifyNewImage, finish) => {
      setupFormModal<HTMLImageElement, {imageData: ImageData, height: number, width: number}>(inputsProps, ({imageData, ...rest}) => {modifyNewImage({src: imageData.dataUrl, ...rest})}, finish)
    }

    const onclick = (e: MouseEvent) => {
      const image = e.target as HTMLImageElement
      const {src, height, width} = image
      window.modifyElement<HTMLImageElement, AttributesToAsk>(image, getModifyInputsProps({src, height, width}))
    }
    const getNewImage = () => createImage({onclick})
  
    const imageOption = <Option getNewOptionNode={getNewImage} withText={false} insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                        <FcPicture size={30}/>
                        </Option>

    return {imageOption}
}

export default useImageOption