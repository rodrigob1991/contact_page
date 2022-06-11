import styled from "@emotion/styled"

export const ROUTE_ERROR_404 = "/404"

export default function PageError404() {
    return <Container>Page Not Found</Container>
}

const Container = styled.div` 
  display: flex;
  flex-flow: column;
  height: 100vh;
`

