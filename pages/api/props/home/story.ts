import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {StoryComponent} from "../../../../types/Home"

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: any

    switch (request.method) {
        case "PUT" :
            const story: StoryComponent = params
            try {
                const savedStory = await propsStorageClient.setStory(story)
                httpCode = 200
                body = savedStory
            } catch (e) {
                httpCode = 500
                body = "could not saved the story"
                console.error(e)
            }
            break
        case "DELETE" :
            const storyId: string = params
            try {
                await propsStorageClient.deleteStory(storyId)
                httpCode = 200
                body = "story deleted"
            } catch (e) {
                httpCode = 500
                body = "could not delete the story"
                console.error(e)
            }
            break
        default :
            httpCode = 405
            body = "invalid http method"
    }
    response.status(httpCode).json(body)
}