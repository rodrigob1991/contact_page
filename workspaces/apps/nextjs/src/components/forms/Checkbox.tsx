import styled from "@emotion/styled"
import { ChangeEventHandler, forwardRef, useEffect, useState } from "react"

export type CheckboxProps = {
  label?: string
  value?: boolean
  onChange?: (checked: boolean) => void
}
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({label, value=false, onChange}, ref) => {
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
         <input ref={ref} type="checkbox" checked={isChecked} onChange={handleChange}/>
         {label}
         </Container>
})

const Container = styled.div`
 display: flex;
 flex-direction: row;
 gap: 10;
 cursor: pointer;
`

export default Checkbox