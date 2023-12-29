import { DetailedHTMLProps, InputHTMLAttributes, forwardRef, Ref } from "react"
import { Input } from "./TextInput"

export type NumberInputProps = {
    setValue: (value: number) => void
    onEnter?: () => void
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>,HTMLInputElement>
export const NumberInput = forwardRef(({
                                         setValue,
                                         onEnter,
                                         ...rest
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
        <Input {...rest} type={"number"} ref={ref}
               onChange={(e) => {setValue(Number(e.target.value))}}
               onKeyDown={handleKeyDown}
        />
    )
})
NumberInput.displayName = "NumberInput"