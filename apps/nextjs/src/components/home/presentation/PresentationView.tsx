import {Presentation, PresentationHTMLElementIdsKey, ViewMode} from "../../../types/home"
import styled from "@emotion/styled"
import React, { use, useEffect, useRef, useState } from "react"
import {ImageViewSelector, ProcessSelectedImage} from "../../FormComponents"
import Image from "next/image"
import SkillsChart, {CreateSkill, DeleteSkill} from "./SkillsChart"
import {Observe} from "../../../pages/user/edit_home"
import {maxWidthSmallestLayout, minWidthFullLayout, presentationLayout as layout, SkillsChartSmallestLayout, SkillsChartLayout, SkillBarWidth, skillsChartLayout, skillsChartSmallestLayout} from "../../../layouts"
import { mainColor } from "../../../colors"
import { css } from "@emotion/react"

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

export default function PresentationView<VM extends ViewMode>({editing, presentation, getHtmlElementId, createSkill, deleteSkill, observe}: Props<VM>) {
      const innerContainerRef = useRef<HTMLDivElement>(null)
      const [innerContainerFlexDirection, setInnerContainerFlexDirection] = useState<"row" | "column">("row")

      const handleResize = () => {
        const innerContainer = innerContainerRef.current
        if (innerContainer) {
          const innerContainerWidth = innerContainer.getBoundingClientRect().width
          // width without borders and scrollbars
          const viewportWidth = document.documentElement.clientWidth
          if (innerContainerWidth > viewportWidth) {
            if (innerContainerFlexDirection === "row") { setInnerContainerFlexDirection("column") }
            else {}
          }else {
            if (innerContainerFlexDirection === "row") {} 
            else {
              const skillsNumber = skills.length
              const skillsChartWidth = (skillsNumber*skillsChartLayout.barWidth)+(skillsNumber-1)*skillsChartLayout.skillsGap
              if(innerContainerWidth + layout.gap + skillsChartWidth <= viewportWidth) {
                setInnerContainerFlexDirection("row")
              }
            } 
          }
        }
      }

      useEffect(() => {
        handleResize()
        return () => { window.removeEventListener("resize", handleResize) }
      },[])

      useEffect(() => {
        window.removeEventListener("resize", handleResize)
        window.addEventListener("resize", handleResize)
      }, [innerContainerFlexDirection])

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
        skillsChart = <SkillsChart editing skills={skills} createSkill={createSkill} deleteSkill={deleteSkill}
                         getHtmlElementId={getSkillHtmlId} observe={observe}/>
    } else {
        skillsChart = <SkillsChart skills={skills}/>
    }

  return (
    <Container>
      <InnerContainer ref={innerContainerRef} flexDirection={innerContainerFlexDirection}>
        <PortraitNameIntroductionContainer>
          <PortraitNameContainer>
            {editing ? <ImageViewSelector imageMaxSize={16} width={100} height={90} processSelectedImage={processSelectedImage} src={imageDataUrl} />
              : <Portrait alt={name} src={imageDataUrl || ""} width={100} height={90}/>
            }
            <Name id={nameHtmlId} contentEditable={editing} ref={editing ? r => { if (r) (observe)(r, { mutation: "default" }) } : undefined}>
              {name}
            </Name>
          </PortraitNameContainer>
          <Separator />
          <IntroductionContainer>
            <Introduction id={introductionHtmlId} contentEditable={editing} ref={editing ? r => { if (r) (observe)(r, { mutation: "default" }) } : undefined}>
              {introduction}
            </Introduction>
          </IntroductionContainer>
        </PortraitNameIntroductionContainer>
        <Separator horizontal={innerContainerFlexDirection === "column"} />
        {skillsChart}
      </InnerContainer>
    </Container>
  )
}

const Separator = styled.div<{ horizontal?: boolean }>`
  ${({ horizontal }) => {
    return css`
      ${horizontal ? "height" : "width"}: 2px;
      ${horizontal ? "width" : "height"}: 100%;
    `;
  }}
  background-color: ${mainColor};
`
const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  box-shadow: 5px 10px #888888;
  width: 100%;
  padding: 10px;
  @media (max-width: ${minWidthFullLayout}px) {
  }
    `
const InnerContainer = styled.div<{flexDirection: "row" | "column"}>`
    display: flex;
    flex-direction: ${({flexDirection}) => flexDirection};
    width: fit-content;
    gap: ${layout.gap}px;
    padding: 15px;
    border-width: 2px;
    border-color: ${mainColor};
    @media (max-width: ${minWidthFullLayout}px) {
    }
      `
const PortraitNameIntroductionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: end;
  gap: ${layout.gap}px;
  height: 100%;
  @media (max-width: ${minWidthFullLayout}px) {
  }
    `
const PortraitNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`
const Name = styled.h1`
  display: inline-block;
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-style: solid;
  text-transform: uppercase;
  text-align: center;
  font-weight: bold;
  font-size: 2.5rem;
  text-shadow: 2px 2px 5px #000000;
  padding: 0;
  margin: 0;
  width: min-content;
    `
const IntroductionContainer = styled.div`
  display: flex;
  align-items: center;
  width: 300px;
  @media (max-width: ${maxWidthSmallestLayout}px) {
  }
`
const Introduction = styled.h2`
  font-weight: bold;
  font-size: 2.5rem;
  text-align: justify;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
  margin: 0;
  padding: 0;
    `
const Portrait = styled(Image)`
  width: ${layout.imageSize}px;
  height: ${layout.imageSize}px;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: ${layout.imageSizeSmall}px;
    height: ${layout.imageSizeSmall}px;
  }
`