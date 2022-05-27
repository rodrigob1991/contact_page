import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {StoryAPIParam, StoryComponent} from "../../../../types/Home"

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: any

    switch (request.method) {
        case "PUT" :
            const story: StoryAPIParam = params
            if (!validStory(story)) {
                httpCode = 400
                body = "missing data"
            } else {
                try {
                    const savedStory = await propsStorageClient.setStory(story as StoryComponent)
                    httpCode = 200
                    body = savedStory
                } catch (e) {
                    httpCode = 500
                    body = "could not saved the story"
                    console.error(e)
                }
            }
            break
        case "DELETE" :
            const storyId: string = params
            if (storyId === undefined || storyId.length === 0) {
                httpCode = 400
                body = "missing story id"
            } else {
                try {
                    await propsStorageClient.deleteStory(storyId)
                    httpCode = 200
                    body = "story deleted"
                } catch (e) {
                    httpCode = 500
                    body = "could not delete the story"
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

const validStory = (story: StoryAPIParam) => {
    return story !== undefined && story.title !== undefined
        && story.title.length > 0 && story.body !== undefined
        && story.body.length > 0
}