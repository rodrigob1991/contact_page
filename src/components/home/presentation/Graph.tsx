import styled from "@emotion/styled"

type GraphElement = { name: string, rate: number }
type GraphProps = {
    title: string
    elements: GraphElement[]
    maxWidth: number
}
export const Graph = ({title, elements, maxWidth}: GraphProps) => {
    return (
        <Container>
            <label style={{color: "white", fontWeight: "bold", fontSize: "20px"}}>{title}</label>
            {elements.map((e) =>
                <Element key={e.name} width={maxWidth*e.rate/100}> {e.name} </Element>)
            }
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 20%;
  gap: 5px;
`
const Element = styled.div<{width: number}>`
  display: flex;
  background-color: white;
  padding-left: 5px;
  color: #696969;
  height: 20px;
  font-weight: bold;
  border-radius: 3px;
  ${({width})=> 
    `max-width: ${width}px;`}
 `