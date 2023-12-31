import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"
import { IconBaseProps } from "react-icons"
import { BsChevronDoubleDown, BsChevronDoubleUp, BsEyeFill, BsEyeSlashFill, BsFillTrashFill } from "react-icons/bs"
import { FaHandPointLeft, FaHandPointRight, FaPlus, FaTrashRestore } from "react-icons/fa"
import { mainColor, secondColor, thirdColor } from "../theme"


export const Button = styled.button`
 color: ${thirdColor};
 background-color: ${secondColor};
 width: fit-content;
 font-weight: bold;
 cursor: pointer;
 font-size: 2.2rem;
 margin: 0;
 border-color: ${mainColor};
`
export const PlusButton = ({className,...rest}: IconBaseProps) => {
    return <FaPlus className={"button " + (className ?? "")} {...rest}/>
}
export const DeleteButton = ({className, ...rest}: IconBaseProps) => {
    return <BsFillTrashFill className={"button " + (className ?? "")} {...rest}/>
}
export const RecoverButton = ({className, ...rest}: IconBaseProps) => {
    return <FaTrashRestore className={"button " + (className ?? "")} {...rest}/>
}
export const OpenOrCloseStoryButton = ({className, isOpen, ...rest}: {isOpen: boolean} & IconBaseProps) => {
    return isOpen ? <BsChevronDoubleUp className={"button " + (className ?? "")} {...rest}/>
                  : <BsChevronDoubleDown className={"button " + (className ?? "")} {...rest}/>
}
export const DeleteOrRecoverButton = ({initShowDelete, handleDelete, handleRecover,...rest}:{ initShowDelete?: boolean, handleDelete: () => void ,handleRecover: () => void } & IconBaseProps) => {
    const [showDelete, setShowDelete] = useState<boolean>(initShowDelete ?? true)

    const handleOnClickRecover: MouseEventHandler<SVGElement> = (e) => {
        setShowDelete(true)
        handleRecover()
    }
    const handleOnClickDelete: MouseEventHandler<SVGElement> = (e) => {
        setShowDelete(false)
        handleDelete()
    }

    return showDelete ? <DeleteButton {...rest} onClick={handleOnClickDelete}/>
                      : <RecoverButton {...rest} onClick={handleOnClickRecover}/>
    
}
export const SeeOrUnseeButton = ({className, see,...rest}: { see: boolean } & IconBaseProps) => {
    return see ? <BsEyeSlashFill className={"button " + (className ?? "")} {...rest}/>
               : <BsEyeFill className={"button " + (className ?? "")} {...rest}/>
}

export const PointHandLeftOrRightButton = ({className, left, ...rest}: { left: boolean} & IconBaseProps) => {
    return left ? <FaHandPointLeft className={"button " + (className ?? "")} {...rest}/>
                : <FaHandPointRight className={"button " + (className ?? "")} {...rest}/>
}



