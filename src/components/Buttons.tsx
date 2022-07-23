import styled from "@emotion/styled"
import {FaPlus, FaTrashRestore} from "react-icons/fa"
import {BsChevronDoubleDown, BsChevronDoubleUp, BsFillTrashFill} from "react-icons/bs"
import React from "react";
import {jsx} from "@emotion/react";


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
                           }: { onClick: (e:React.MouseEvent<SVGElement>) => void,id: string, color?: string, size?: number}) => {
    return (
        <FaPlus style={{cursor: "pointer"}} {...props}/>
    )
}
export const DeleteButton = ({
                                 ...props
                             }: { onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        <BsFillTrashFill style={{cursor: "pointer"}} {...props}/>
    )
}
export const RecoveryButton = ({
                                  ...props
                              }: { onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        <FaTrashRestore style={{cursor: "pointer"}} {...props}/>
    )
}
export const OpenOrCloseStoryButton = ({
                                           isOpen,
                                           ...rest
                                       }: { isOpen: boolean, onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        isOpen ? <BsChevronDoubleUp {...rest} style={{cursor: "pointer"}}/>
            : <BsChevronDoubleDown {...rest} style={{cursor: "pointer"}}/>
    )
}
export const DeleteOrRecoverStoryButton = ({
                                               isDelete,
                                               ...rest
                                           }: { isDelete: boolean, onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        isDelete ? <RecoveryButton {...rest}/>
            : <DeleteButton {...rest}/>
    )
}



