import styled from "@emotion/styled"

export const Error404Route = "/404"

export default function Error404() {
    return <Container>Page Not Found</Container>
}

const Container = styled.div` 
  padding-top: 20vh;
  font-weight: bold;
  font-size: 50px;
  color: #FFFFFF;
`

