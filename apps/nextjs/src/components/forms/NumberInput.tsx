import { forwardRef } from "react"
import { Input } from "./TextInput"

export type NumberInputProps = {
    value?: number
    setValue: (value: number) => void
    placeholder?: string
    required?:boolean
    onEnter?: () => void
}
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({ value, setValue, onEnter, ... rest}, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key.toLowerCase()) {
            case "enter" :
                if (onEnter)
                    onEnter()
                e.preventDefault()
                break
        }
    }

    return (
        <Input type={"number"} ref={ref} value={value} {...rest} onChange={(e) => {setValue(Number(e.target.value))}} onKeyDown={handleKeyDown}/>
    )
})
//NumberInput.displayName = "NumberInput"

export default NumberInput