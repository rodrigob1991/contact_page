import styled from "@emotion/styled"
import {useEffect, useState} from "react"
import {countTimeFromDate} from "../utils/Dates"

export default function Clock({fromDate, backgroundColor}: { fromDate: Date, backgroundColor?: string }) {
    const [countedTime, setCountedTime] = useState({hours: 0, minutes: 0, seconds: 0})

    useEffect(() => {
            countTimeFromDate(fromDate, setCountedTime)
        }
        , [fromDate])

    return (
        <Container backgroundColor={backgroundColor}>
            <UnitContainer>
                <UnitLabel>h:</UnitLabel>
                <UnitValue>{countedTime.hours}</UnitValue>
            </UnitContainer>
            <UnitContainer>
                <UnitLabel>m:</UnitLabel>
                <UnitValue>{countedTime.minutes}</UnitValue>
            </UnitContainer>
            <UnitContainer>
                <UnitLabel>s:</UnitLabel>
                <UnitValue>{countedTime.seconds}</UnitValue>
            </UnitContainer>
        </Container>
    )
}

const Container = styled.div<{backgroundColor?: string}>`
  background-color: ${props => props.backgroundColor || "#FFFFFF"};
  align-items: center;
  display: flex;
  flex-direction: row;
  padding: 15px;
  height: fit-content;
  border: 4px solid;
  gap: 15px;
`
const UnitContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 5px;
`
const UnitLabel = styled.label`
 font-size: 18px;
 font-weight: bold;
`
const UnitValue = styled.text`
 font-size: 15px;
`


