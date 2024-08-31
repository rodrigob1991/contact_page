import { css } from "@emotion/react"
import styled from "@emotion/styled"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Available } from "utils/src/types"
import { presentationLayout as layout, maxWidthSmallestLayout, minWidthFullLayout, skillsChartLayout } from "../../../layouts"
import { Observe } from "../../../pages/user/edit_home"
import { mainColor } from "../../../theme"
import { Presentation, PresentationHTMLElementIdsKey, ViewMode } from "../../../types/home"
import { ImageViewSelector, ProcessSelectedImage } from "../../FormComponents"
import SkillsChart, { CreateSkill, RemoveSkill } from "./SkillsChart"

export type GetHtmlElementId = <K extends PresentationHTMLElementIdsKey>(key: K, skillId: (K extends "skills" ? string : undefined)) =>  string
type EditingProps = {
    editing: true
    getHtmlElementId: GetHtmlElementId
    createSkill: CreateSkill
    removeSkill: RemoveSkill
    observe: Observe
}
type Props<VM extends ViewMode> = {
    presentation: Presentation
} & Available<VM, "editing", EditingProps>

export default function PresentationView<VM extends ViewMode>({editing, presentation, getHtmlElementId, createSkill, removeSkill, observe}: Props<VM>) {
      const {name, introduction, skills, image} = presentation
      const skillsNumber = skills.length

      const innerContainerRef = useRef<HTMLDivElement>(null)
      const portraitNameIntroductionContainerRef = useRef<HTMLDivElement>(null)
      const [innerContainerFlexDirection, setInnerContainerFlexDirection] = useState<"row" | "column">("row")
      const [introductionWidth, setIntroductionWidth] = useState(layout.introductionMaxWidth)
      const getSkillsChartMaxWidth = () => skillsChartLayout.getWidth(skillsNumber)
      const [skillsChartWidth, setSkillsChartWidth] = useState(getSkillsChartMaxWidth())

      useEffect(() => {
        const resizeView = () => {
          const innerContainer = innerContainerRef.current
          const portraitNameIntroductionContainer = portraitNameIntroductionContainerRef.current
          if (innerContainer && portraitNameIntroductionContainer) {
            const innerContainerWidth = innerContainer.getBoundingClientRect().width
            const portraitNameIntroductionContainerWidth = portraitNameIntroductionContainer.getBoundingClientRect().width
            // width without borders and scrollbars
            const viewportWidth = document.documentElement.clientWidth
            if (innerContainerWidth > viewportWidth) {
              if (innerContainerFlexDirection === "row") {
                setInnerContainerFlexDirection("column")
              }
              if (skillsChartWidth + layout.innerContainerPadding*2 > viewportWidth) {
                const newSkillWidth = skillsChartLayout.getMaxWidth(viewportWidth - layout.innerContainerPadding*2, skillsNumber)
                setSkillsChartWidth(newSkillWidth)
              }
              if (portraitNameIntroductionContainerWidth + layout.innerContainerPadding * 2  > viewportWidth) {
                setIntroductionWidth((introductionWidth) =>  {
                  return  layout.getIntroductionMaxWidth(introductionWidth -(portraitNameIntroductionContainerWidth - viewportWidth) - layout.innerContainerPadding * 2)
                })
              }
            }else {
              if (innerContainerFlexDirection === "row") {
                // nothing to do
              } 
              else {
                if(innerContainerWidth + layout.separatorWidthOrHeight  + (layout.gap*2) + getSkillsChartMaxWidth() <= viewportWidth) {
                  setInnerContainerFlexDirection("row")
                  setSkillsChartWidth(getSkillsChartMaxWidth())
                  setIntroductionWidth(layout.introductionMaxWidth)
                }else {
                  setSkillsChartWidth(skillsChartLayout.getMaxWidth(viewportWidth - layout.innerContainerPadding*2, skillsNumber))
                  setIntroductionWidth((introductionWidth) =>  layout.getIntroductionMaxWidth(introductionWidth + viewportWidth - innerContainerWidth))
                }
              } 
            }
          }
        }

        resizeView()
        
        window.addEventListener("resize", resizeView)

        return () => {
          window.removeEventListener("resize", resizeView)
        }
    }, [innerContainerFlexDirection, introductionWidth, skillsChartWidth])

    const imageDataUrl = image?.src
    const processSelectedImage: ProcessSelectedImage = (name, extension, dataUrl) => {
        presentation.image = {name: name, extension: extension, src: dataUrl}
    }

    let nameHtmlId
    let introductionHtmlId
    let getSkillHtmlId
    let skillsChart
    if (editing) {
        nameHtmlId = getHtmlElementId("name", undefined)
        introductionHtmlId = getHtmlElementId("introduction", undefined)
        getSkillHtmlId = (skillId: string) => getHtmlElementId("skills", skillId)
        skillsChart = <SkillsChart editing skills={skills} width={skillsChartWidth} createSkill={createSkill} removeSkill={removeSkill}
                         getHtmlElementId={getSkillHtmlId} observe={observe}/>
    } else {
        skillsChart = <SkillsChart skills={skills} width={skillsChartWidth}/>
    }

  return (
    <Container>
      <InnerContainer ref={innerContainerRef} flexDirection={innerContainerFlexDirection}>
        <PortraitNameIntroductionContainer ref={portraitNameIntroductionContainerRef}>
          <PortraitNameContainer>
            {editing ? <ImageViewSelector imageMaxSize={16} width={layout.imageSize} height={layout.imageSize} processSelectedImage={processSelectedImage} src={imageDataUrl} />
              : <Portrait alt={name} src={imageDataUrl || ""} width={100} height={90}/>
            }
            <Name id={nameHtmlId} contentEditable={editing} ref={editing ? r => { if (r) (observe)(r, { mutation: "default" }) } : undefined}>
              {name}
            </Name>
          </PortraitNameContainer>
          <Separator/>
          <IntroductionContainer>
            <Introduction id={introductionHtmlId} width={introductionWidth} contentEditable={editing} ref={editing ? r => { if (r) (observe)(r, { mutation: "default" }) } : undefined}>
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

export const Separator = styled.div<{ horizontal?: boolean }>`
  ${({ horizontal }) => {
    return css`
      ${horizontal ? "height" : "width"}: ${layout.separatorWidthOrHeight}px;
      ${horizontal ? "width" : "height"}: 100%;
    `;
  }}
`
const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  border-bottom: 3px solid ${mainColor};
  @media (max-width: ${minWidthFullLayout}px) {
  }
    `
const InnerContainer = styled.div<{flexDirection: "row" | "column"}>`
    display: flex;
    flex-direction: ${({flexDirection}) => flexDirection};
    width: fit-content;
    gap: ${layout.gap}px;
    padding: ${layout.innerContainerPadding}px;
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
  outline-color: ${mainColor};
    `
const IntroductionContainer = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  @media (max-width: ${maxWidthSmallestLayout}px) {
  }
`
const Introduction = styled.h2<{ width: number }>`
  font-weight: bold;
  font-size: 2.5rem;
  overflow: auto;
  color: #ffffff;
  text-shadow: 2px 2px 5px #000000;
  margin: 0;
  padding: 0;
  outline-color: ${mainColor};
  ${({ width }) => css`
    width: ${width}px;
  `}
`;
const Portrait = styled(Image)`
  width: ${layout.imageSize}px;
  height: ${layout.imageSize}px;
  @media (max-width: ${maxWidthSmallestLayout}px) {
    width: ${layout.imageSizeSmall}px;
    height: ${layout.imageSizeSmall}px;
  }
`