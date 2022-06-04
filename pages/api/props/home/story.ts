import {NextApiRequest, NextApiResponse} from "next"
import {PropsStorageClient} from "../../../../classes/Props"
import {Story, StoryComponent, StoryPutParam} from "../../../../types/Home"

const STORY_API_PATH = "/api/props/home/story"

const API_ENDPOINT = process.env.NEXT_PUBLIC_BASE_URL + STORY_API_PATH

type PutBodyResponse = {
    story?: Story
    errorMessage?: string
}
type DeleteBodyResponse = {
    message: string
}

export const putStory = async (story: StoryComponent) => {
    const result: { succeed: boolean, story?: Story, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(story),
        })

        result.succeed = response.ok

        const body: PutBodyResponse = await response.json()
        if (response.ok) {
            result.story = body.story
        } else {
            result.errorMessage = body.errorMessage
        }

    } catch (e) {
        console.error(`Error getting response: ${e}`)
    }

    return result
}

export const deleteStory = async (storyId: string) => {
    const result: { succeed: boolean, body?: string, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(storyId),
        })

        result.succeed = response.ok

        const body: DeleteBodyResponse = await response.json()
        const message = body.message
        if (response.ok) {
            result.body = message
        } else {
            result.errorMessage = message
        }

    } catch (e) {
        console.error(`Error retrieving response: ${e}`)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: PutBodyResponse | DeleteBodyResponse | string

    const propsStorageClient = new PropsStorageClient()

    switch (request.method) {
        case "PUT" :
            const story: StoryPutParam = params
            if (!validStory(story)) {
                httpCode = 400
                body = {errorMessage: "missing data"}
            } else {
                try {
                    const savedStory = await propsStorageClient.setStory(story as StoryComponent)
                    httpCode = 200
                    body = {story: savedStory}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not saved the story"}
                    console.error(e)
                }
            }
            break
        case "DELETE" :
            const storyId: string = params
            if (storyId === undefined || storyId.length === 0) {
                httpCode = 400
                body = {message: "missing story id"}
            } else {
                try {
                    await propsStorageClient.deleteStory(storyId)
                    httpCode = 200
                    body = {message: "story deleted"}
                } catch (e) {
                    httpCode = 500
                    body = {message: "could not delete the story"}
                    console.error(e)
                }
            }
            break
        default :
            httpCode = 405
            body = "invalid http method"
    }
    response.status(httpCode).json(body)
}

const validStory = (story: StoryPutParam) => {
    return story !== undefined && story.title !== undefined
        && story.title.length > 0 && story.body !== undefined
        && story.body.length > 0
}