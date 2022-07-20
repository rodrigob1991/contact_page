import styled from "@emotion/styled"
import {FaPlus} from "react-icons/fa"
import {BsFillTrashFill} from "react-icons/bs"


export const Button = styled.button<{ backgroundColor?: string }>`
 color: #FFFFFF;
 background-color: ${({backgroundColor}) => backgroundColor || "#00008B"};
 width: fit-content;
 font-weight: bold;
 cursor: pointer;
 font-size: 22px;
`
export const PlusButton = ({
                               onClick, color, size
                           }: { onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        <div style={{cursor: "pointer"}} onClick={onClick}>
            <FaPlus color={color} size={size}/>
        </div>
    )
}
export const DeleteButton = ({
                               onClick, color, size
                           }: { onClick: (e: React.MouseEvent) => void, color?: string, size?: number }) => {
    return (
        <div style={{cursor: "pointer"}} onClick={onClick}>
            <BsFillTrashFill color={color} size={size}/>
        </div>
    )
}
