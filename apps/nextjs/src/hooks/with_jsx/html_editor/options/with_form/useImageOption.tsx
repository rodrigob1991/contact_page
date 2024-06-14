import { FcPicture } from "react-icons/fc"
import { ImageData } from "../../../../../components/forms/ImageSelector"
import { createImage } from "../../../../../utils/domManipulations"
import { } from "../../useHtmlEditor"
import Option, { ShowFormModal } from "../Option"
import { UseOptionWithForm } from "./types"

const inputsProps = {
  imageData: {type: "imageSelector"},
  height: {type: "numberInput"},
  width: {type: "numberInput"},
} as const
type InputsProps = typeof inputsProps
type InputsPropsKey = keyof InputsProps

const getModifyInputsProps = (attr: AttributesToAsk) => {
  const modifyInputsProps = structuredClone(inputsProps) as ModifyInputsProps
  for (const key in modifyInputsProps) {
    modifyInputsProps[key as InputsPropsKey].props.value = attr[key as InputsPropsKey] 
  }
  return modifyInputsProps
}
//type AttributesToAsk = {imageData: ImageData, height: number, width: number}
/* const submissionAction: SubmissionAction<typeof inputsProps> = () => {
} */

type Props = {
}
const useImageOption: UseOptionWithForm<Props, "image"> = function({setupFormModal, ...rest}) {
    //const [imageFormModalPropsRest, setImageFormModalPropsRest] = useState({inputsProps, submissionAction})
    //const updateImageFormModalProps = {inputsProps: updateImageFormInputsProps, submissionAction: updateImageFormSubmissionAction}
    //const {setImageFormModalVisible, imageFormModal, getImageFormModalRect, containsImageFormModalNode} = useFormModal({name: "image", buttonText: "insert", ...formModalCommonProps, ...imageFormModalPropsRest})
    const showFormModal: ShowFormModal<HTMLImageElement, {src: string, height: number, width: number}> = (modifyNewImage, finish) => {
      // const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
      //   modifyNewNodes(values)
      //   finish()
      // }
      // setImageFormModalPropsRest({inputsProps, submissionAction})
      // setImageFormModalVisible(true, getFormModalPosition(getImageFormModalRect().height))
      setupFormModal<HTMLImageElement, {imageData: ImageData, height: number, width: number}>(inputsProps, ({imageData, ...rest}) => {modifyNewImage({src: imageData.dataUrl, ...rest})}, finish)
    }

   /*  const [insertOrModifyImage, setInsertOrModifyImage] = useState<InsertOrModifyImage>(() => {})
    const updateInsertOrModifyImage = (fn: InsertOrModifyImage) => {
      setInsertOrModifyImage(() => fn)
    }
    const [removeImage, setRemoveImage] = useState<RemoveImage>(() => {})
    const updateRemoveImage = (fn: RemoveImage) => {
      setRemoveImage(() => fn)
    } */
    const getNewImage = () => createImage({onclick: (e) => {window.modifyElement(e.target as HTMLImageElement, inputsProps)}})

    const onclick = (e: MouseEvent) => {
      const anchor = e.target as HTMLImageElement
      window.modifyElement<HTMLImageElement, AttributesToAsk>(anchor, getModifyInputsProps({href: anchor.href}))
    }
    const getNewAnchor = (t: string) => createAnchor({innerHTML: t, className, onclick})
  
    const imageOption = <Option getNewOptionNode={getNewImage} withText={false} insertInNewLine={false} showFormModal={showFormModal} {...rest}>
                        <FcPicture size={30}/>
                        </Option>

    return {imageOption}
}

export default useImageOption