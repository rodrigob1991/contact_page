import {NextApiRequest, NextApiResponse} from "next"
import {PropsStorageClient} from "../../../../classes/PropsStorageClient"
import {Story, StoryWithoutId} from "../../../../types/Home"
import {AuthResponseBody} from "../../_middleware"
import {isEmptyString} from "../../../../utils/StringFunctions"
import {ApiParamsValidator} from "../../../../classes/ApiParamsValidator"

const STORY_API_ROUTE = "/api/props/home/story"

const URL = process.env.NEXT_PUBLIC_BASE_URL + STORY_API_ROUTE

type PutResponseBody = {
    story?: Story
    errorMessage?: string
}
type DeleteResponseBody = {
    message: string
}

export const putStory = async (story: StoryWithoutId | Story) => {
    const result: { succeed: boolean, story?: Story, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(story),
        })

        result.succeed = response.ok

        if (response.status === 401) {
            const authBody: AuthResponseBody = await response.json()
            result.errorMessage = authBody
        } else {
            const putBody: PutResponseBody = await response.json()
            if (response.ok) {
                result.story = putBody.story
            } else {
                result.errorMessage = putBody.errorMessage
            }
        }
    } catch (e) {
        console.error(`Error getting response: ${e}`)
    }

    return result
}

export const deleteStory = async (storyId: string) => {
    const result: { succeed: boolean, body?: string, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(URL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(storyId),
        })

        result.succeed = response.ok

        if (response.status === 401) {
            const authBody: AuthResponseBody = await response.json()
            result.errorMessage = authBody
        } else {
            const deleteBody: DeleteResponseBody = await response.json()
            if (response.ok) {
                result.body = deleteBody.message
            } else {
                result.errorMessage = deleteBody.message
            }
        }
    } catch (e) {
        console.error(`Error retrieving response: ${e}`)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: PutResponseBody | DeleteResponseBody

    const propsStorageClient = new PropsStorageClient()

    switch (request.method) {
        case "PUT" :
            const story: StoryWithoutId | Story = params
            if (!story || !ApiParamsValidator.isValidSetStory(story)) {
                httpCode = 400
                body = {errorMessage: "invalid data"}
            } else {
                try {
                    const savedStory = await propsStorageClient.setStory(story)
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
            if (isEmptyString(storyId)) {
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
            body = {errorMessage: "invalid http method"}
    }
    response.status(httpCode).json(body)
}