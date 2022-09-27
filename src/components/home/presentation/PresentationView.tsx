import {Presentation, PresentationHTMLElementIds, ViewMode} from "../../../types/Home"
import styled from "@emotion/styled"
import React from "react"
import {ImageViewSelector} from "../../FormComponents"
import Image from "next/image"
import SkillsChart, {CreateSkill} from "./SkillsChart"


type EditingProps = {
    editing: true
    htmlElementIds: PresentationHTMLElementIds
    setPresentationImage: (imageDataUrl: string) => void
} &
type Props<VM extends ViewMode> = {
    presentation: Presentation
} & (VM extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function PresentationView<VM extends ViewMode>({
                                             editing,
                                             presentation: {name, introduction, skills, image: imageDataUrl},
                                             htmlElementIds, setPresentationImage, createSkill
                                         }: Props<VM>) {
    return (
        <Container>
            {editing ? <SkillsChart editing createSkill={createSkill as CreateSkill}  skills={skills} width={250} /> : <SkillsChart skills={skills} width={250}/>}
            <InnerContainer>
            <NameImageContainer>
                {editing ? <ImageViewSelector imageMaxSize={16} width={100} height={90} processImage={setPresentationImage}
                                         imageDataUrl={imageDataUrl}/>
                        : <Image src={imageDataUrl as string} width={100} height={90} layout={"intrinsic"}/>}
                <Name id={htmlElementIds?.name} contentEditable={editing}>
                    {name}
                </Name>
            </NameImageContainer>
            <Introduction id={htmlElementIds?.introduction} contentEditable={editing}
                                      dangerouslySetInnerHTML={{__html: introduction}}/>
            </InnerContainer>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  padding: 20px;
  gap: 80px;
  background-image: linear-gradient(#00008B,#0000FF);
  box-shadow: 5px 10px #888888;
    `
const InnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
    `
const Name = styled.span`
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
const Introduction = styled.span`
  font-weight: bold;
  font-size: 21px;
  background-color: #778899;
  padding: 7px;
  border-radius: 15px;
  border-style: solid;
  border-color: #FFFFFF;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
    `
const NameImageContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
    `