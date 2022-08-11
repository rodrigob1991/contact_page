import {Presentation, SetHomeProps, Story, NewStory} from "../types/Home"
import {isEmpty} from "../utils/StringFunctions"

export class ApiParamsValidator {
    static isValidPresentation = ({name, introduction}: Presentation) => {
        return !isEmpty(name)
            && !isEmpty(introduction)
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
    static areValidStoriesId = (storiesId: string[]) => {
        let areValid = true
        let index = 0
        while (areValid && index < storiesId.length) {
            areValid = !isEmpty(storiesId[index])
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

    static areValidSetHomeProps = ({
                                       presentation,
                                       stories:
                                           {delete: deleteStories, new: newStories, update: updateStories} = {}
                                   }: SetHomeProps) => {

        return (!presentation || this.isValidPresentation(presentation)) &&
            (!deleteStories || this.areValidStoriesId(deleteStories)) &&
            (!updateStories || this.areValidStories(updateStories)) &&
            (!newStories || this.areValidNewStories(newStories))
    }
}