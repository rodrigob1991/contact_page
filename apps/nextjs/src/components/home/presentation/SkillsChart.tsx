import { css } from "@emotion/react"
import styled from "@emotion/styled"
import Image from "next/image"
import React, { MouseEvent, MouseEventHandler, useEffect, useRef, useState } from "react"
import { orderByComparePreviousByNumber } from "utils/src/arrays"
import { useAsk } from "../../../hooks/useAsk"
import { useTooltip } from "../../../hooks/useTooltip"
import { SkillBarWidth, skillsChartLayout as layout, minWidthFullLayout, presentationLayout } from "../../../layouts"
import { Observe } from "../../../pages/user/edit_home"
import { tooltipStyle } from "../../../theme"
import { NewSkill, Skill, ViewMode } from "../../../types/home"
import { PlusButton } from "../../Buttons"
import { ImageViewSelector, TextInput } from "../../FormComponents"

type SkillViewState = {idHtml: string, skill: Skill | NewSkill}

export type CreateSkill = () => [string, NewSkill]
export type DeleteSkill = (skillId: string) => void
export type GetHtmlElementId = (skillId: string) => string
export type EditingProps = {
    editing: true
    createSkill: CreateSkill
    deleteSkill : DeleteSkill
    getHtmlElementId: GetHtmlElementId
    observe: Observe
}
type Props<VM extends ViewMode> = {
    skills: Skill[]
    width: number
} & (VM extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function SkillsChart<VM extends ViewMode>({skills, width, editing, createSkill, deleteSkill, getHtmlElementId, observe}: Props<VM>) {
    const [skillsViewStates, setSkillsViewStates] = useState<SkillViewState[]>(orderByComparePreviousByNumber(skills, "position").map((s) => {
        return {idHtml: s.id, skill: s}
    }))

    const getHslColor = (rate: number) => {
        const hue = rate*120/100
        const saturation = 80
        const lightness = 55

        return `hsl(${hue},${saturation}%,${lightness}%)`
    }

    const [nameTooltip, updateNameTooltip] = useTooltip({style: tooltipStyle})
    const handleMouseEnterSkillView = (e: MouseEvent<HTMLDivElement>, name: string) => {
        updateNameTooltip(true, true, -40, 0, name)
    }
    const handleMouseLeaveSkillView: MouseEventHandler<HTMLDivElement> = (e) => {
        updateNameTooltip(false)
    }
    const handleTouchStartSkillView = (e: React.TouchEvent<HTMLDivElement>, name: string) => {
        updateNameTooltip(true, true, -45, -20, name)
        setTimeout(() => {updateNameTooltip(false)}, 1500)
    }

    const skillBarHasTopMargin = (position: number) => layout.getWidth(position) > width

    const getSkillsView = () => skillsViewStates.map(({skill: {name, rate, image, position}}) =>
        <SkillViewContainer key={name}>
            <BaseImage alt={name} src={image.src} width={layout.barWidth} height={layout.barWidth} skillBarWidth={layout.barWidth}
                   onMouseEnter={e => {handleMouseEnterSkillView(e, name)}} onMouseLeave={handleMouseLeaveSkillView}
                   onTouchStart={ e=> {handleTouchStartSkillView(e, name)}}/>
            <SkillBar key={name} rate={rate} hasTopMargin={skillBarHasTopMargin(position)} hslColor={getHslColor(rate)}
                       onMouseEnter={e => {handleMouseEnterSkillView(e, name)}} onMouseLeave={handleMouseLeaveSkillView}
                       onTouchStart={ e=> {handleTouchStartSkillView(e, name)}}/>
        </SkillViewContainer>)

    useEffect(() => {
        setSkillsViewStates((skillsViewStates) => {
            const updatedSkillsViewStates = []
            for (const skillViewStates of skillsViewStates) {
                const prevSkill = skillViewStates.skill
                const predicate = (s: Skill) => "id" in prevSkill ? prevSkill.id === s.id : prevSkill.name === s.name
                const skill = skills.find(predicate)
                if (!skill) {
                    throw new Error("always must the skill exist")
                }
                updatedSkillsViewStates.push({idHtml: skill.id, skill: skill})
            }
            return updatedSkillsViewStates
        })
    }, [skills])

    const handleCreateSkill = (e: React.MouseEvent<SVGElement>) => {
        const [idHtml, newSkill] = (createSkill as CreateSkill)()
        setSkillsViewStates([...skillsViewStates, {idHtml: idHtml, skill: newSkill}])
    }
    const handleOnTwoClickSkill = (index: number) => {
        (deleteSkill as DeleteSkill)(skillsViewStates[index].idHtml)
        setSkillsViewStates(
            (current) => {
                const next = [...current]
                next.splice(index, 1)
                return next
            })
    }
    const clickCount = useRef(0)
    const handleOnClickSkill = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        let callback
        switch (e.detail) {
            case 1:
                clickCount.current = 1
                callback = () => {
                    if (clickCount.current === 1) {
                        handleOnOneClickSkill(index, e.clientY, e.clientX)
                    }
                }
                break
            case 2:
                clickCount.current = 2
                callback = () => {
                    if (clickCount.current === 2) {
                        handleOnTwoClickSkill(index)
                    }
                }
                break
            default:
                clickCount.current = 0
        }
        if (callback)
            setTimeout(callback, 200)
    }

    const refToSkillNameInput = useRef<HTMLInputElement | null>(null)
    const focusSkillNameInput = () => refToSkillNameInput.current?.focus()

    const [selectedSkillIndex, setSelectedSkillIndex] = useState(-1)
    const [selectedSkillName, setSelectedSkillName] = useState( "")
    const mutateSkillName = () => {
        skillsViewStates[selectedSkillIndex].skill.name = selectedSkillName
    }
    const mutateSkillImage = (index: number, name: string, extension: string, dataUrl: string) => {
        skillsViewStates[index].skill.image = {name: name, extension: extension, src: dataUrl}
    }
    const mutateSkillsPosition = (indexOne: number, indexTwo: number) => {
        const skillOne = skillsViewStates[indexOne].skill
        const skillTwo = skillsViewStates[indexTwo].skill
        const positionOne = skillOne.position
        skillOne.position = skillTwo.position
        skillTwo.position = positionOne
    }

    const handleOnOneClickSkill = (index: number, top: number, left: number) => {
        setSelectedSkillIndex(index)
        setSelectedSkillName(skillsViewStates[index].skill.name)
        askSkillName(top, left)
    }

    const onEnterSkillName = () => {
        mutateSkillName()
        hideAskSkillName()
    }
    const onEscapeSkillName = () => {
        setSelectedSkillName("")
        hideAskSkillName()
    }
    const [askSkillName, hideAskSkillName, isAskingSkillName, AskSkillNameElement] =
        useAsk({onShow: focusSkillNameInput,
                                    child: <TextInput placeholder={"name"}
                                                      style={{width: "120px"}}
                                                      ref={refToSkillNameInput}
                                                      value={selectedSkillName}
                                                      setValue={setSelectedSkillName}
                                                      onEnter={onEnterSkillName}
                                                      onEscape={onEscapeSkillName}/>})

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.dataTransfer.setData("text/plain", index.toString())
    }
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()

    }
    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
        e.preventDefault()

        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"))
        mutateSkillsPosition(fromIndex,toIndex)
        setSkillsViewStates((current) => {
            const next = [...current]
            next[fromIndex] = current[toIndex]
            next[toIndex] = current[fromIndex]
            return next
        })
    }

    const getEditableSkillsView = () =>
        <>
            {AskSkillNameElement}
            {skillsViewStates.map(({idHtml, skill: {name, rate, image, position}}, index) =>
                <SkillViewContainer id={idHtml} key={idHtml} draggable={true} onDragStart={(e)=>{ handleDragStart(e, index)}} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDrag={handleDrag} onDrop={(e)=> { handleDrop(e, index)} }>
                    <ImageViewSelector src={image.src} processSelectedImage={(name, extension, dataUrl)=>  { mutateSkillImage(index, name, extension, dataUrl)}}
                                       imageMaxSize={1} width={layout.barWidth} height={layout.barWidth} description={name}
                                       style={{backgroundColor: "white"}}/>
                    <SkillBar hslColor={getHslColor(rate)} ref={r => {if (r) (observe as Observe)(r, {resize: "default"})}}
                               id={(getHtmlElementId as GetHtmlElementId)(idHtml)} resize={true} rate={rate} hasTopMargin={skillBarHasTopMargin(position)}
                               onClick={(e) => { handleOnClickSkill(e, index) }}/>
                </SkillViewContainer>)}
            <PlusButton size={15} color={"white"} onClick={handleCreateSkill}/>
        </>

    return (
        <>{nameTooltip}
        <Container width={width}>
            {editing
                ? getEditableSkillsView()
                : getSkillsView()}
        </Container>
        </>
    )
}
const Container = styled.div<{ width: number }>`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: end;
  gap: ${layout.skillsGap}px;
  width: ${({ width }) => width}px;
  @media (max-width: ${minWidthFullLayout}px) {
  }
`;
const SkillViewContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${layout.barImageGap}px;
`
const SkillBar = styled.div<{rate: number, hasTopMargin: boolean, resize?: boolean, hslColor: string}>`
  display: flex;
  overflow: hidden;
  padding-left: 5px;
  color: #696969;
  width: ${layout.barWidth}px;
  font-weight: bold;
  ${({rate, hasTopMargin, resize, hslColor})=> css`
    height: ${rate*layout.barMaxHeight/100}px;
    width: ${layout.barWidth}px;
    margin-top: ${hasTopMargin ? presentationLayout.gap : 0}px;
    background-color: ${hslColor};
    ${resize ? "resize: vertical;" : ""}
   `}
 `
const BaseImage = styled(Image)<{skillBarWidth: SkillBarWidth}>`
${({skillBarWidth}) => css`
   width: ${skillBarWidth}px;
   height: ${skillBarWidth}px;
  `}
`