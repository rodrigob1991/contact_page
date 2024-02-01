import styled from "@emotion/styled"
import { ChangeEventHandler, useEffect, useState } from "react"

export type CheckboxProps = {
  label?: string
  value?: boolean
  onChange?: (checked: boolean) => void
}
export default function Checkbox({label, value=false, onChange}: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(value)
  useEffect(() => {
    setIsChecked(value)
  }, [value])

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsChecked(!isChecked)
    if(onChange)
    onChange(isChecked)
  }

  return <Container>
         <input type="checkbox" checked={isChecked} onChange={handleChange}/>
         {label}
         </Container>
}
const Container = styled.div`
 display: flex;
 flex-direction: row;
 gap: 10;
 cursor: pointer;
`