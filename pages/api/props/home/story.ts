import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {StoryComponent, StoryPutParam} from "../../../../types/Home"
import path from "path"

const ENDPOINT = `${process.env.BASE_URL}/${path.relative("/pages","./")}`

type PutBodyResponse = {
    story?: StoryComponent
    errorMessage?: string
}
type DeleteBodyResponse = {
    message: string
}
type BodyResponse = PutBodyResponse | DeleteBodyResponse | string

export const putStory = async (story: StoryComponent) => {
    const response = await fetch(ENDPOINT, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(story),
    })
    const body: PutBodyResponse = await response.json()

    return {httpCode: response.status, body: body}
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: BodyResponse

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