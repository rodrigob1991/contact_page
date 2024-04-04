import { useEffect, useState } from "react"
import { FcPicture } from "react-icons/fc"
import { createImage } from "../../../../../utils/domManipulations"
import useFormModal, { SubmissionAction } from "../../../forms/useFormModal"
import { formModalCommonProps } from "../../useHtmlEditor"
import Option, { AskAttributes } from "../Option"
import { UseOptionWithForm } from "./types"

const inputsProps = {
  imageData: {type: "imageSelector"},
  height: {type: "numberInput"},
  width: {type: "numberInput"},
} as const
const submissionAction: SubmissionAction<typeof inputsProps> = () => {
}

type Props = {
}
const useImageOption: UseOptionWithForm<Props, "image"> = function({getFormModalPosition, setHtmlEditorVisibleTrue}) {
    const [imageFormModalPropsRest, setImageFormModalPropsRest] = useState({inputsProps, submissionAction})
    //const updateImageFormModalProps = {inputsProps: updateImageFormInputsProps, submissionAction: updateImageFormSubmissionAction}
    const {setImageFormModalVisible, imageFormModal, getImageFormModalRect, containsImageFormModalNode} = useFormModal({name: "image", buttonText: "insert", ...formModalCommonProps, ...imageFormModalPropsRest})
    const askAttributes: AskAttributes = (modifyNewNodes, finish) => {
      const submissionAction: SubmissionAction<typeof inputsProps> = (values) => {
        modifyNewNodes(values)
        finish()
      }
      setImageFormModalPropsRest({inputsProps, submissionAction})
      setImageFormModalVisible(true, getFormModalPosition(getImageFormModalRect().height))
    }

    useEffect(() => {
      window.modifyImageElement = (img: HTMLImageElement) => {
        const inputsProps = {
          imageData: {type: "imageSelector", props: {value: {dataUrl: img.src, name: img.dataset.name as string, extension: img.dataset.extension as string}}},
          height: {type: "numberInput"},
          width: {type: "numberInput"},
          remove: {type: "checkbox", props: {label: "remove"}}
        } as const
        const submissionAction: SubmissionAction<typeof inputsProps> = ({remove, imageData: {dataUrl, name, extension}, height, width}) => {
          if (remove) {
            img.remove()
          } else {
            img.src = dataUrl
            img.height = height
            img.width = width
            img.dataset.name = name
            img.dataset.extension = extension
          }
          setHtmlEditorVisibleTrue()
        }
        setImageFormModalPropsRest({inputsProps, submissionAction})
        //const divParent = img.parentElement as HTMLDivElement
        /* updateInsertOrModifyImage(({dataUrl, name, extension, height, width}) => {
            //img.id = id
            img.src = dataUrl
            img.height = height
            img.width = width
            img.dataset.name = name
            img.dataset.extension = extension
            //divParent.style.paddingLeft = left + "px"
          }
        ) */
        /* updateRemoveImage(() => {
          (img.parentElement as HTMLDivElement).remove()
        }) */

        const {top, left} = img.getBoundingClientRect()
        setImageFormModalVisible(
          true,
          {top: `${top}px`, left: `${left}px`},
         /*  {imageData: {
            dataUrl: img.src,
              name: img.dataset.name as string,
              extension: img.dataset.extension as string,
           },
           height: img.height,
           width: img.width,
           remove: false} */
        )
      }
    }, [])
   /*  const [insertOrModifyImage, setInsertOrModifyImage] = useState<InsertOrModifyImage>(() => {})
    const updateInsertOrModifyImage = (fn: InsertOrModifyImage) => {
      setInsertOrModifyImage(() => fn)
    }
    const [removeImage, setRemoveImage] = useState<RemoveImage>(() => {})
    const updateRemoveImage = (fn: RemoveImage) => {
      setRemoveImage(() => fn)
    } */
    const imageOption = <Option getNewOptionNode={() => createImage()} withText={false} insertInNewLine={false} askAttributes={askAttributes} setHtmlEditorVisibleTrue={setHtmlEditorVisibleTrue}>
                        <FcPicture size={30}/>
                        </Option>

    return {imageOption, imageFormModal, containsImageFormModalNode}
}

export default useImageOption