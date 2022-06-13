import styled from "@emotion/styled"

export const ROUTE_ERROR_500 = "/500"

export default function PageError500() {
    return <Container>Something was wrong</Container>
}

const Container = styled.div` 
  display: flex;
  flex-flow: column;
  height: 100vh;
  padding-top: 20vh;
  align-items: center;
  font-weight: bold;
  font-size: 50px;
  color: #FFFFFF;
  background-color: #00008B;
`

