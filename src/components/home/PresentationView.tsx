import {Presentation, PresentationHTMLElementIds, ViewMode} from "../../types/Home"
import styled from "@emotion/styled"
import React, {useState} from "react"
import Image from 'next/image'
import {ImageSelector} from "../FormComponents";
type EditingProps = {
    editing: true
    htmlElementIds: PresentationHTMLElementIds
}
type Props<VM extends ViewMode> = {
    presentation: Presentation
} & (VM extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function PresentationView<VM extends ViewMode>({
                                             editing,
                                             presentation: {name, introduction},
                                             htmlElementIds
                                         }: Props<VM>) {
    const [imageUrl, setImageUrl] = useState("")

    return (
        <PresentationContainer>
            <PresentationNameImageContainer>
                <ImageSelector imageMaxSize={16} width={100} height={90}/>
                <PresentationName id={htmlElementIds?.name} contentEditable={editing}>
                    {name}
                </PresentationName>
            </PresentationNameImageContainer>
            <PresentationIntroduction id={htmlElementIds?.introduction} contentEditable={editing}>
                {introduction}
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
  display: inline-block;
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 25px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.span`
  font-weight: bold;
  font-size: 21px;
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