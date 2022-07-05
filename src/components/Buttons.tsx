import styled from "@emotion/styled"

export const Button = styled.button<{ backgroundColor?: string }>`
 color: #FFFFFF;
 background-color: ${({backgroundColor}) => backgroundColor || "#00008B"};
 width: fit-content;
 font-weight: bold;
 cursor: pointer;
 font-size: 22px;
`