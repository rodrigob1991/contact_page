import styled from "@emotion/styled"
import {PlusButton} from "../../Buttons"
import React, {useEffect, useRef, useState} from "react"
import {NewSkill, Skill, ViewMode} from "../../../types/Home"
import {Observe} from "../../../pages/user/edit_home";
import {ImageViewSelector, TextInput} from "../../FormComponents";
import {useAsk} from "../../../utils/Hooks";

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

export const containerStyles = {padding: 7, height: 200}

export default function SkillsChart<VM extends ViewMode>({skills, editing, createSkill, deleteSkill, getHtmlElementId, observe}: Props<VM>) {
    console.table(skills)
    const [skillsViewStates, setSkillsViewStates] = useState<SkillViewState[]>(skills.map((s) => {
        return {idHtml: s.id, skill: s}
    }))
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
    const handleTwoClickSkill = (index: number) => {
        (deleteSkill as DeleteSkill)(skillsViewStates[index].idHtml)
        setSkillsViewStates(
            (current) => {
                const next = [...current]
                next.splice(index, 1)
                return next
            })
    }
    const handleOnClickSkill = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        switch (e.detail) {
            case 1:
                handleOneClickSkill(index)
                break
            case 2:
                handleTwoClickSkill(index)
                break
        }
    }

    const getHslColor = (rate: number) => {
        const hue = rate*120/100
        const saturation = 80
        const lightness = 55

        return `hsl(${hue},${saturation}%,${lightness}%)`
    }


    const getStoriesView = () => skillsViewStates.map(({skill: {name, rate}}) =>
        <SkillView key={name} height={rate} hslColor={getHslColor(rate)}> {name} </SkillView>)

    const [currentSkillName, setCurrentSkillName] = useState("")
    const refToSkillNameInput = useRef<HTMLInputElement | null>(null)
    const focusSkillNameInput = () => refToSkillNameInput.current?.focus()
    const handleOneClickSkill = (index: number) => {
        const nextMutateSkillName = () => {
            skillsViewStates[index].skill.name = currentSkillName
        }
        setMutateSkillName((current)=> nextMutateSkillName)
        askSkillName(50, 50)
    }
    type MutateSkillName = ()=> void
    const [mutateSkillName, setMutateSkillName] = useState<MutateSkillName>()
    const onEnterSkillName = () => {
        (mutateSkillName as MutateSkillName)()
        hideAskSkillName()
    }
    const [askSkillName, hideAskSkillName, isAskingSkillName, AskSkillNameElement] =
        useAsk({onShow: focusSkillNameInput,
                                    child: <TextInput placeholder={"name"}
                                                      style={{width: "100px"}}
                                                      ref={refToSkillNameInput}
                                                      value={currentSkillName}
                                                      setValue={setCurrentSkillName}
                                                      onEnter={onEnterSkillName}/>})

    const getEditableStoriesView = () => skillsViewStates.map(({idHtml, skill: {name, rate}}, index) =>
        <SkillViewContainer key={name}>
            <ImageViewSelector imageMaxSize={1} width={20} height={20} description={name} style={{backgroundColor: "white"}}/>
            <SkillView hslColor={getHslColor(rate)} ref={r => {if(r) (observe as Observe)(r, {mutation: "default",resize: "default"})}}
                       id={(getHtmlElementId as GetHtmlElementId)(idHtml)} resize={true} height={rate} onClick={(e)=> handleOnClickSkill(e, index)}/>
            {AskSkillNameElement}
        </SkillViewContainer>)
    return (
        <Container>
            <TitleContainer>
            <label style={{ fontWeight: "bold", fontSize: "20px"}}>skills</label>
            {editing && <PlusButton size={15} onClick={handleCreateSkill}/>}
            </TitleContainer>
           {editing ? getEditableStoriesView() : getStoriesView()}
        </Container>
    )
}
const Container = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  left: 0;
  padding: ${containerStyles.padding}px;
  height: ${containerStyles.height}px;
  gap: 5px;
`
const TitleContainer = styled.div`
  display: flex;
  color: white;
  gap: 5px;
`
const SkillViewContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
`
const SkillView = styled.div<{height: number, resize?: boolean, hslColor: string}>`
  display: flex;
  overflow: hidden;
  padding-left: 5px;
  color: #696969;
  width: 20px;
  font-weight: bold;
  border-radius: 3px;
  max-height: 100%;
  ${({height, resize, hslColor})=> 
    `height: ${height}%;
    background-color: ${hslColor};
    ${resize ? "resize: vertical;" : ""}
   `}
 `