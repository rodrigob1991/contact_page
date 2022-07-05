import {Presentation as PresentationData} from "../types/Home"
import styled from "@emotion/styled"
import {Button} from "./Buttons"
import React, {useState} from "react"
import {putPresentation} from "../pages/api/props/home/presentation"

type PresentationProps = {
    editing: boolean
    data?: PresentationData
}

export const Presentation = ({editing, data}: PresentationProps) => {
    const [saved, setSaved] = useState(data === undefined)

    const nameElementId = "presentation-name"
    const introductionElementId = "presentation-introduction"

    const getPresentationDate = () => {
        const name = (document.getElementById(nameElementId) as HTMLElement).innerText
        const introduction = (document.getElementById(introductionElementId) as HTMLElement).innerText
        console.log(`name: ${name}. introduction: ${introduction}`)

        return {name: name, introduction: introduction}
    }

    const handleSavePresentation = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const operation = saved ? "UPDATE" : "CREATE"

        getPresentationDate()

       /* putPresentation(getPresentationDate()).then(({succeed, errorMessage}) => {
            let message
            if (succeed) {
                message = `presentation ${operation}D`
                setSaved(true)
            } else {
                message = errorMessage || `could not ${operation} the presentation`
            }

            setSaveResultMessage(message)
        })*/
    }

        const [saveResultMessage, setSaveResultMessage] = useState("")


        return (
            <PresentationContainer>
                <PresentationNameImageContainer>
                    {/*   <Image src="/yo.jpeg" width="100" height="100"/>*/}
                    <PresentationName id={nameElementId} contentEditable={editing}>
                        {data?.name || ""}
                    </PresentationName>
                </PresentationNameImageContainer>
                <PresentationIntroduction id={introductionElementId} contentEditable={editing}>
                    {data?.introduction || ""}
                </PresentationIntroduction>
                {editing ?
                    <>
                        <Button onClick={handleSavePresentation}> SAVE </Button>
                        {saveResultMessage}
                    </>
                    : ""}
            </PresentationContainer>
        )
    }


const PresentationName = styled.div`
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.div`
  font-weight: bold;
  font-size: 18px;
  background-color: #778899;
  padding: 7px;
  border-radius: 15px;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationNameImageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 20px;
  background-image: linear-gradient(#00008B,#0000FF);
  align-items: center;
  box-shadow: 5px 10px #888888;
    `