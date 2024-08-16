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
export const RemoveButton = ({className, ...rest}: IconBaseProps) => {
    return <BsFillTrashFill className={"button " + (className ?? "")} {...rest}/>
}
export const RecoverButton = ({className, ...rest}: IconBaseProps) => {
    return <FaTrashRestore className={"button " + (className ?? "")} {...rest}/>
}
export const OpenOrCloseStoryButton = ({className, isOpen, ...rest}: {isOpen: boolean} & IconBaseProps) => {
    return isOpen ? <BsChevronDoubleUp className={"button " + (className ?? "")} {...rest}/>
                  : <BsChevronDoubleDown className={"button " + (className ?? "")} {...rest}/>
}

type RemoveOrRecoverButtonProps = { 
    initShowRemove?: boolean
    removeHandler: () => void 
    recoverHandler: () => void 
} & IconBaseProps
export const RemoveOrRecoverButton = ({initShowRemove, removeHandler, recoverHandler,...rest}: RemoveOrRecoverButtonProps) => {
    const [showRemove, setShowRemove] = useState<boolean>(initShowRemove ?? true)

    const onClickRecoverHandler: MouseEventHandler<SVGElement> = (e) => {
        setShowRemove(true)
        recoverHandler()
    }
    const OnClickRemoveHandler: MouseEventHandler<SVGElement> = (e) => {
        setShowRemove(false)
        removeHandler()
    }

    return showRemove ? <RemoveButton {...rest} onClick={OnClickRemoveHandler}/>
                      : <RecoverButton {...rest} onClick={onClickRecoverHandler}/>
    
}
export const SeeOrUnseeButton = ({className, see,...rest}: { see: boolean } & IconBaseProps) => {
    return see ? <BsEyeSlashFill className={"button " + (className ?? "")} {...rest}/>
               : <BsEyeFill className={"button " + (className ?? "")} {...rest}/>
}

export const PointHandLeftOrRightButton = ({className, left, ...rest}: { left: boolean} & IconBaseProps) => {
    return left ? <FaHandPointLeft className={"button " + (className ?? "")} {...rest}/>
                : <FaHandPointRight className={"button " + (className ?? "")} {...rest}/>
}



