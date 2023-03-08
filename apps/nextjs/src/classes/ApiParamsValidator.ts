import {
    CreateHomePropsArgs,
    CreatePresentationArgs,
    NewSkill,
    NewStory,
    Skill,
    Story,
    UpdateHomePropsArgs,
    UpdatePresentationArgs
} from "../types/Home"
import {isEmpty} from "common/utils/Strings"

export class ApiParamsValidator {
    static isValidSkill = ({id, name, rate}: Skill) => {
        return !isEmpty(id)
            && !isEmpty(name)
            && rate > 0
    }
    static isValidNewSkill = ({name, rate}: NewSkill) => {
        return !isEmpty(name)
            && rate > 0
    }
    static areValidIds = (ids: string[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < ids.length) {
            areValid = !isEmpty(ids[index])
            index++
        }
        return areValid
    }
    static areValidSkills = (skills: Skill[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < skills.length) {
            areValid = this.isValidSkill(skills[index])
            index++
        }
        return areValid
    }
    static areValidNewSkills = (newSkills: NewSkill[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < newSkills.length) {
            areValid = this.isValidNewSkill(newSkills[index])
            index++
        }
        return areValid
    }
    static isValidCreatePresentation = ({name, introduction, skills: {new: newSkills}}: CreatePresentationArgs) => {
        return !isEmpty(name)
            && !isEmpty(introduction)
            && (!newSkills || this.areValidNewSkills(newSkills))
    }
    static isValidUpdatePresentation = ({skills: {new: newSkills, update: updateSkills, delete: deleteSkills}, ...rest}: UpdatePresentationArgs) => {
        return (!("name" in rest) || !isEmpty(rest.name))
            && (!("introduction" in rest) || !isEmpty(rest.introduction))
            && (!newSkills || this.areValidNewSkills(newSkills))
            && (!updateSkills || this.areValidSkills(updateSkills))
            && (!deleteSkills || this.areValidIds(deleteSkills))
    }
    static isValidStory = ({id, title, body}: Story) => {
        return !isEmpty(id)
            && !isEmpty(title)
            && !isEmpty(body)
    }
    static isValidNewStory = ({title, body}: NewStory) => {
        return !isEmpty(title)
            && !isEmpty(body)
    }
    static areValidStories = (stories: Story[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < stories.length) {
            areValid = this.isValidStory(stories[index])
            index++
        }
        return areValid
    }
    static areValidNewStories = (stories: NewStory[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < stories.length) {
            areValid = this.isValidNewStory(stories[index])
            index++
        }
        return areValid
    }

    static isValidSetStory = (story: NewStory | Story) => {
        return "id" in story ? this.isValidStory(story) : this.isValidNewStory(story)
    }
    static areValidCreateHomePropsArgs = ({
                                              presentation, stories: {new: newStories}
                                          }: CreateHomePropsArgs) => {

        return (presentation && this.isValidCreatePresentation(presentation))
            && (!newStories || this.areValidNewStories(newStories))
    }
    static areValidUpdateHomePropsArgs = ({
                                          presentation,
                                          stories:
                                              {new: newStories, update: updateStories, delete: deleteStories}
                                      }: UpdateHomePropsArgs) => {

        return (!presentation || this.isValidUpdatePresentation(presentation))
            && (!newStories || this.areValidNewStories(newStories))
            && (!updateStories || this.areValidStories(updateStories))
            && (!deleteStories || this.areValidIds(deleteStories))
    }
}