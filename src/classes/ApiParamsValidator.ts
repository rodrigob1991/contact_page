import {PresentationWithoutId, SetHomeProps, Story, StoryWithoutId} from "../types/Home";
import {isEmptyString} from "../utils/StringFunctions"

export class ApiParamsValidator {
    static isValidPresentation = ({name, introduction}: PresentationWithoutId) => {
        return !isEmptyString(name)
            && !isEmptyString(introduction)
    }
    static isValidStory = ({id, title, body}: Story) => {
        return !isEmptyString(id)
            && !isEmptyString(title)
            && !isEmptyString(body)
    }
    static isValidNewStory = ({title, body}: StoryWithoutId) => {
        return !isEmptyString(title)
            && !isEmptyString(body)
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
    static areValidNewStories = (stories: StoryWithoutId[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < stories.length) {
            areValid = this.isValidNewStory(stories[index])
            index++
        }
        return areValid
    }

    static isValidSetStory = (story: StoryWithoutId | Story) => {
        return "id" in story ? this.isValidStory(story) : this.isValidNewStory(story)
    }

    static areValidSetHomeProps = ({
                                       presentation,
                                       stories:
                                           {delete: deleteStories, new: newStories, update: updateStories} = {}
                                   }: SetHomeProps) => {

        return (!presentation || this.isValidPresentation(presentation)) &&
            (!deleteStories || this.areValidStories(deleteStories)) &&
            (!updateStories || this.areValidStories(updateStories)) &&
            (!newStories || this.areValidNewStories(newStories))
    }
}