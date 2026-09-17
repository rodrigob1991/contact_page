import styled from "@emotion/styled"
import {useEffect, useState} from "react"
import {CountedTime, countTimeFromDate, WhatUnitsCount} from "utils/src/dates"

export default function Clock({
                                  fromDate,
                                  whatUnitsCount,
                                  backgroundColor
                              }: { fromDate: Date, whatUnitsCount: WhatUnitsCount, backgroundColor?: string }) {
    const [countedTime, setCountedTime] = useState<CountedTime>({days: 0,hours: 0, minutes: 0, seconds: 0})

    useEffect(() => {
            countTimeFromDate(fromDate,whatUnitsCount, setCountedTime)
        }
        , [fromDate])

    return (
        <Container backgroundColor={backgroundColor}>
            {whatUnitsCount.days &&
            <UnitContainer>
                <UnitLabel>d:</UnitLabel>
                <UnitValue>{countedTime.days}</UnitValue>
            </UnitContainer>
            }
            {whatUnitsCount.hours &&
            <UnitContainer>
                <UnitLabel>h:</UnitLabel>
                <UnitValue>{countedTime.hours}</UnitValue>
            </UnitContainer>
            }
            {whatUnitsCount.minutes &&
            <UnitContainer>
                <UnitLabel>m:</UnitLabel>
                <UnitValue>{countedTime.minutes}</UnitValue>
            </UnitContainer>
            }
            {whatUnitsCount.seconds &&
            <UnitContainer>
                <UnitLabel>s:</UnitLabel>
                <UnitValue>{countedTime.seconds}</UnitValue>
            </UnitContainer>
            }
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


