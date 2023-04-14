import {Presentation, PresentationHTMLElementIdsKey, ViewMode} from "../../../types/home"
import styled from "@emotion/styled"
import React from "react"
import {ImageViewSelector, ProcessSelectedImage} from "../../FormComponents"
import Image from "next/image"
import SkillsChart, {CreateSkill, DeleteSkill} from "./SkillsChart"
import {Observe} from "../../../pages/user/edit_home"
import {maxWidthSmallestLayout, minWidthFullLayout} from "../../../dimensions"
import {secondColor} from "../../../colors"

export type GetHtmlElementId = <K extends PresentationHTMLElementIdsKey>(key: K, skillId: (K extends "skills" ? string : undefined)) =>  string
type EditingProps = {
    editing: true
    getHtmlElementId: GetHtmlElementId
    createSkill: CreateSkill
    deleteSkill : DeleteSkill
    observe: Observe
}
type Props<VM extends ViewMode> = {
    presentation: Presentation
} & (VM extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function PresentationView<VM extends ViewMode>({
                                             editing,
                                             presentation,
                                             getHtmlElementId, createSkill, deleteSkill, observe
                                         }: Props<VM>) {
    const {name, introduction, skills, image} = presentation
    const imageDataUrl = image?.src
    const processSelectedImage: ProcessSelectedImage = (name, extension, dataUrl) => {
        presentation.image = {name: name, extension: extension, src: dataUrl}
    }

    let nameHtmlId
    let introductionHtmlId
    let getSkillHtmlId
    let skillsChart
    if (editing && getHtmlElementId && createSkill && deleteSkill && observe) {
        nameHtmlId = getHtmlElementId("name", undefined)
        introductionHtmlId = getHtmlElementId("introduction", undefined)
        getSkillHtmlId = (skillId: string) => getHtmlElementId("skills", skillId)
        skillsChart = <SkillsChart editing skills={skills} width={250} createSkill={createSkill} deleteSkill={deleteSkill}
                         getHtmlElementId={getSkillHtmlId} observe={observe}/>
    } else {
        skillsChart = <SkillsChart skills={skills} width={250}/>
    }

    return (
        <Container>
            <InnerContainer>
            <NameImageIntroductionContainer>
            <NameImageContainer>
                {editing ? <ImageViewSelector imageMaxSize={16} width={100} height={90} processSelectedImage={processSelectedImage} src={imageDataUrl}/>
                         : <Image alt={""} src={imageDataUrl || ""} width={100} height={90} layout={"intrinsic"}/>
                }
                <Name id={nameHtmlId} contentEditable={editing} ref={ editing ? r => {if (r) (observe as Observe)(r, {mutation: "default"})} : undefined}>
                    {name}
                </Name>
                <LogoImage alt={""} src={"/favicon.png"} width={80} height={80}/>
            </NameImageContainer>
            <Introduction id={introductionHtmlId} contentEditable={editing} ref={ editing ? r => {if(r) (observe as Observe)(r, {mutation: "default"})} : undefined}
                                      dangerouslySetInnerHTML={{__html: introduction}}/>
            </NameImageIntroductionContainer>
            {skillsChart}
            </InnerContainer>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  box-shadow: 5px 10px #888888;
  @media (max-width: ${minWidthFullLayout}px) {
    align-items: center;
    justify-content: left;
  }
    `
const InnerContainer = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: end;
  @media (max-width: ${minWidthFullLayout}px) {
    align-items: left;
  }`
const NameImageIntroductionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  @media (max-width: ${minWidthFullLayout}px) {
    width: fit-content;
  }
    `
const Name = styled.span`
  display: inline-block;
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 2.5rem;
  text-shadow: 2px 2px 5px #000000;
    `
const Introduction = styled.span`
  font-weight: bold;
  font-size: 2.5rem;
  background-color: ${secondColor};
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
const LogoImage = styled(Image)`
  width: 100px;
  height: 100px;
  margin-left: 20px;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    margin-left: 5px;
  }
`