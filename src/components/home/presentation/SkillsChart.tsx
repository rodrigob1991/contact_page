import styled from "@emotion/styled"
import {PlusButton} from "../../Buttons"
import React, {useEffect, useState} from "react"
import {Skill, NewSkill, SkillHTMLElementIds, ViewMode} from "../../../types/Home"

type SkillViewState = {idHtml: string, skill: Skill | NewSkill}

export type CreateSkill = () => [string, NewSkill]
export type DeleteSkill = () => void
export type GetHtmlElementIds = () => SkillHTMLElementIds
export type EditingProps = {
    editing: true
    createSkill: CreateSkill
    deleteSkill : DeleteSkill
    getHtmlElementIds: GetHtmlElementIds
}
type Props<VM extends ViewMode> = {
    skills: Skill[]
    width: number
} & (VM extends "editing" ? EditingProps : {[K in keyof EditingProps]? : never})

export default function SkillsChart<VM extends ViewMode>({skills, width, editing, createSkill, deleteSkill, getHtmlElementIds}: Props<VM>) {
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
    return (
        <Container width={width}>
            <TitleContainer>
            <label style={{ fontWeight: "bold", fontSize: "20px"}}>skills</label>
            {editing && <PlusButton size={15} onClick={handleCreateSkill}/>}
            </TitleContainer>
            {skills.map((s) =>
                <SkillView key={s.name} width={s.rate}> {s.name} </SkillView>)
            }
        </Container>
    )
}
const Container = styled.div<{width: number}>`
  display: flex;
  flex-direction: column;
  padding: 7px;
  ${({width})=> `
  width: ${width}px;`}
  gap: 5px;
`
const TitleContainer = styled.div`
  display: flex;
  color: white;
  gap: 5px;
`
const SkillView = styled.div<{width: number}>`
  display: flex;
  resize: horizontal;
  background-color: white;
  padding-left: 5px;
  color: #696969;
  height: 20px;
  font-weight: bold;
  border-radius: 3px;
  ${({width})=> 
    `width: ${width}%;`}
 `