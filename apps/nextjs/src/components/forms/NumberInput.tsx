import { Ref, forwardRef } from "react"
import { Input } from "./TextInput"

export type NumberInputProps = {
    value?: number
    setValue: (value: number) => void
    onEnter?: () => void
}
export const NumberInput = forwardRef(({ 
                                        value,
                                        setValue,
                                        onEnter,
                                     }: NumberInputProps, ref : Ref<HTMLInputElement>) => {
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
        <Input type={"number"} ref={ref} value={value} onChange={(e) => {setValue(Number(e.target.value))}} onKeyDown={handleKeyDown}/>
    )
})
NumberInput.displayName = "NumberInput"