import styled from "@emotion/styled"
import {PlusButton} from "../../Buttons"
import React, {useEffect, useRef, useState} from "react"
import {NewSkill, Skill, ViewMode} from "../../../types/Home"
import {Observe} from "../../../pages/user/edit_home"
import {ImageViewSelector, TextInput} from "../../FormComponents"
import {useAsk, useTooltip} from "../../../utils/Hooks"
import Image from "next/legacy/image"
import {minWidthFullLayout} from "../../../Dimensions"
import {orderByComparePreviousByNumber} from "utils/src/arrays"

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

export const containerStyles = {height: 180}

export default function SkillsChart<VM extends ViewMode>({skills, editing, createSkill, deleteSkill, getHtmlElementId, observe}: Props<VM>) {
    const [skillsViewStates, setSkillsViewStates] = useState<SkillViewState[]>(orderByComparePreviousByNumber(skills, "position").map((s) => {
        return {idHtml: s.id, skill: s}
    }))

    const getHslColor = (rate: number) => {
        const hue = rate*120/100
        const saturation = 80
        const lightness = 55

        return `hsl(${hue},${saturation}%,${lightness}%)`
    }

    const [NameTooltip, showNameTooltip, hideNameTooltip] = useTooltip({topDeviation: -40})
    const handleMouseEnterSkillView = (e: React.MouseEvent<HTMLDivElement>, name: string) => {
        showNameTooltip(name)
    }
    const handleMouseLeaveSkillView = (e: React.MouseEvent<HTMLDivElement>) => {
        hideNameTooltip()
    }
    const handleTouchStartSkillView = (e: React.TouchEvent<HTMLDivElement>, name: string) => {
        showNameTooltip(name, {top: e.touches[0].clientY -45, left: e.touches[0].clientX - 20})
        setTimeout(() => hideNameTooltip(), 1500)
    }
    const handleTouchEndSkillView = (e: React.TouchEvent<HTMLDivElement>) => {
        hideNameTooltip()
    }

    const getSkillView = () => skillsViewStates.map(({skill: {name, rate, image}}) =>
        <SkillViewContainer key={name}>
            <Image alt={""} src={image.src} width={20} height={20} layout={"intrinsic"} style={{backgroundColor: "white", width: 20, height: 20}}
                   onMouseEnter={e => {handleMouseEnterSkillView(e, name)}} onMouseLeave={handleMouseLeaveSkillView}
                   onTouchStart={ e=> {handleTouchStartSkillView(e, name)}}/>
            <SkillView key={name} height={rate} hslColor={getHslColor(rate)}
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

    const getEditableSkillView = () =>
        <>
            {AskSkillNameElement}
            {skillsViewStates.map(({idHtml, skill: {name, rate, image}}, index) =>
                <SkillViewContainer id={idHtml} key={idHtml} draggable={true} onDragStart={(e)=> handleDragStart(e, index)} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDrag={handleDrag} onDrop={(e)=> handleDrop(e, index)}>
                    <ImageViewSelector src={image.src} processSelectedImage={(name, extension, dataUrl)=>  mutateSkillImage(index, name, extension, dataUrl)}
                                       imageMaxSize={1} width={20} height={20} description={name}
                                       style={{backgroundColor: "white"}}/>
                    <SkillView hslColor={getHslColor(rate)} ref={r => {if (r) (observe as Observe)(r, {resize: "default"})}}
                               id={(getHtmlElementId as GetHtmlElementId)(idHtml)} resize={true} height={rate}
                               onClick={(e) => handleOnClickSkill(e, index)}/>
                </SkillViewContainer>)}
        </>

    return (
        <Container>
            {NameTooltip}
            {editing
                ? <>{getEditableSkillView()} <PlusButton size={15} color={"white"} onClick={handleCreateSkill}/></>
                : getSkillView()}
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  left: 0;
  height: ${containerStyles.height}px;
  gap: 5px;
  @media (max-width: ${minWidthFullLayout}px) {
    position: relative;
  }
`
const SkillViewContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
`
const SkillView = styled.div<{height: number, resize?: boolean, hslColor: string}>`
  display: flex;
  overflow: hidden;
  padding-left: 5px;
  color: #696969;
  width: 20px;
  font-weight: bold;
  max-height: 100%;
  ${({height, resize, hslColor})=> 
    `height: ${height}%;
    background-color: ${hslColor};
    ${resize ? "resize: vertical;" : ""}
   `}
 `