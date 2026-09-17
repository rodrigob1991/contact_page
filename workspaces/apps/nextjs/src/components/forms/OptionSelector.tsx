import styled from "@emotion/styled"
import { MouseEventHandler, useState } from "react"

type Props<E extends string> = {
    id?: string
    processRefToValueHtmlElement?: (e: HTMLElement) => void
    options: E[]
    initSelectedOptionIndex?: number
    fontSize?: string
    color?: string
}

const OptionSelector = <E extends string>({id, processRefToValueHtmlElement, options, initSelectedOptionIndex=0, fontSize, color}: Props<E>) => {
    const styles = {fontSize: fontSize || "15px", color: color || "black"}

    const [selectedOption, setSelectedOption] = useState(options[initSelectedOptionIndex])
    const [show, setShow] = useState(false)

    const selectionHandler = (option: E) => {

        setSelectedOption(option)
        setShow(false)
    }
    const openMenuHandler: MouseEventHandler<HTMLLabelElement> = (e) => {
        setShow(!show)
    }

    return (
        <DropDown>
            <DropDownValue id={id} ref={processRefToValueHtmlElement ? r => {if(r) processRefToValueHtmlElement(r) } : undefined} {...styles} onClick={openMenuHandler}>{selectedOption}</DropDownValue>
            <DropDownMenu show={show}>
               {options.map((o) => <DropDownMenuOption key={o} {...styles} onClick={e => {selectionHandler(o)}}> {o}
                                       </DropDownMenuOption>)
                }
            </DropDownMenu>
        </DropDown>
    )
}
export default OptionSelector

const DropDown = styled.div`
  position: relative;
`
const DropDownValue = styled.span<{fontSize: string}>`
${({fontSize, color})=> 
    `font-size: ${fontSize}; 
     color: ${color};`}
  font-weight: bold;
  cursor: pointer;
  z-index: -1;
`
const DropDownMenuOption = styled.div<{fontSize: string}>`
${({fontSize, color})=>
    `font-size: ${fontSize}; 
     color: ${color};`}
  font-weight: bold;
  padding: .45rem;
  cursor: pointer;
  border-left: 2px solid;
  border-right: 2px solid;
  border-top: 2px solid;
  :last-child {
    border-bottom: 2px solid;
    }
`
const DropDownMenu = styled.div<{ show: boolean }>`
  position: absolute;
  left: 0;
  top: calc(100% + .25rem);
  background-color: white;
  z-index: 1;
  border-radius: .25rem;
  box-shadow: 0 2px 5px 0 rgba(0,0,0,.1);
  ${({show}) => show ?
    `display: block;
    transform: translateY(0);` :
    `display: none;
    transform: translateY(-10px);`}
  transition: display 150ms ease-in-out, transform 150ms ease-in-out;
`