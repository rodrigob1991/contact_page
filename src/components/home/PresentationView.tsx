import {PresentationWithoutId, PresentationHTMLElementIds} from "../../types/Home"
import styled from "@emotion/styled"
import React from "react"

type PresentationProps = {
    editing: boolean
    htmlElementIds: PresentationHTMLElementIds
    presentation: PresentationWithoutId
}

export default  function PresentationView({editing, presentation, htmlElementIds: {nameHtmlElementId,introductionHtmlElementId}}: PresentationProps) {

    return (
        <PresentationContainer>
            <PresentationNameImageContainer>
                {/*   <Image src="/yo.jpeg" width="100" height="100"/>*/}
                <PresentationName id={nameHtmlElementId} contentEditable={editing}>
                    {presentation.name}
                </PresentationName>
            </PresentationNameImageContainer>
            <PresentationIntroduction id={introductionHtmlElementId} contentEditable={editing}>
                {presentation.introduction}
            </PresentationIntroduction>
        </PresentationContainer>
    )
}

const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 20px;
  background-image: linear-gradient(#00008B,#0000FF);
  align-items: center;
  box-shadow: 5px 10px #888888;
    `
const PresentationName = styled.span`
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.span`
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