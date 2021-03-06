import styled from "@emotion/styled"

export const ROUTE_ERROR_404 = "/404"

export default function PageError404() {
    return <Container>Page Not Found</Container>
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

