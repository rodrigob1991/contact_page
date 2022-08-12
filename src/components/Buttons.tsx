import styled from "@emotion/styled"
import {FaPlus, FaTrashRestore} from "react-icons/fa"
import {BsChevronDoubleDown, BsChevronDoubleUp, BsEyeFill, BsEyeSlashFill, BsFillTrashFill} from "react-icons/bs"
import React, {SVGAttributes} from "react";
import {jsx} from "@emotion/react";
import {IconBaseProps, IconType} from "react-icons";


export const Button = styled.button<{ backgroundColor?: string }>`
 color: #FFFFFF;
 background-color: ${({backgroundColor}) => backgroundColor || "#00008B"};
 width: fit-content;
 font-weight: bold;
 cursor: pointer;
 font-size: 22px;
`
export const PlusButton = ({
                               ...props
                           }: IconBaseProps) => {
    return (
        <FaPlus style={{cursor: "pointer"}} {...props}/>
    )
}
export const DeleteButton = ({
                                 ...props
                             }: IconBaseProps) => {
    return (
        <BsFillTrashFill style={{cursor: "pointer"}} {...props}/>
    )
}
export const RecoveryButton = ({
                                   ...props
                               }: IconBaseProps) => {
    return (
        <FaTrashRestore style={{cursor: "pointer"}} {...props}/>
    )
}
export const OpenOrCloseStoryButton = ({
                                           isOpen,
                                           ...rest
                                       }: { isOpen: boolean } & IconBaseProps) => {
    return (
        isOpen ? <BsChevronDoubleUp {...rest} style={{cursor: "pointer"}}/>
            : <BsChevronDoubleDown {...rest} style={{cursor: "pointer"}}/>
    )
}
export const DeleteOrRecoverStoryButton = ({
                                               isDelete,
                                               ...rest
                                           }: { isDelete: boolean } & IconBaseProps) => {
    return (
        isDelete ? <RecoveryButton {...rest}/>
            : <DeleteButton {...rest}/>
    )
}
export const SeeOrUnseeButton = ({
                                     see,
                                     ...rest
                                 }: { see: boolean } & IconBaseProps) => {
    return (
        see ? <BsEyeSlashFill {...rest} style={{cursor: "pointer"}}/>
            : <BsEyeFill {...rest} style={{cursor: "pointer"}}/>
    )
}



