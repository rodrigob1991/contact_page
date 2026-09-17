import { FcPicture } from "react-icons/fc"
import { createImage } from "../../../../../utils/domManipulations"
import { InputsValues } from "../../../forms/useFormModal"
import { } from "../../useHtmlEditor"
import Option, { ShowFormModal } from "../Option"
import { ModifiableOptionData, ModifyInputsProps, UseOptionWithForm } from "./types"

const type = "img"

const inputsProps = [
  {type: "imageSelector"},
  {type: "numberInput"},
  {type: "numberInput"}
] as const

type InputsProps = typeof inputsProps
type ModifiableAttributes = {src: string, height: number, width: number}
export type ModifiableImageData = ModifiableOptionData<HTMLImageElement, ModifiableAttributes, InputsProps>

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
const useImageOption: UseOptionWithForm<HTMLImageElement, ModifiableAttributes, InputsProps, Props> = function({setupFormModal, ...optionPropsRest}) {
    const showFormModal: ShowFormModal<HTMLImageElement, ModifiableAttributes> = (updateDOM) => {
      setupFormModal<InputsProps>(inputsProps, (inputsValues) => {updateDOM(mapInputsValuesToAttrs(inputsValues))})
    }

    const optionProps = {
      type,
      getNewOptionNode: () => createImage(),
      withText: false,
      insertInNewLine: false,
      showFormModal,
      insertNodesBeforeShowFormModal: false,
      ...optionPropsRest
    }
  
    const option = <Option {...optionProps}>
                   <FcPicture size={30}/>
                   </Option>

    return {type, getModifyInputsProps, mapInputsValuesToAttrs, option}
}

export default useImageOption