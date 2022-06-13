import styled from "@emotion/styled"
import {css} from "@emotion/react"

export const SucceedOperationMessage = ({message, succeed}: { message: string, succeed: boolean }) => {
    return (
        <Label succeed={succeed}>{message}</Label>
    )
}

const Label = styled.label<{ succeed: boolean }>`
    font-size: 15px;
    font-weight: bold;
    ${props =>
    css`
      color: #${props.succeed ? "ADFF2F" : "B22222"};
    `}
    `