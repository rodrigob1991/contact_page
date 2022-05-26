import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {PresentationComponent} from "../../../../types/Home"

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: any

    switch (request.method) {
        case "PUT" :
            const presentation: PresentationComponent = params
            try {
                const savedPresentation = await propsStorageClient.setPresentation(presentation)
                httpCode = 200
                body = savedPresentation
            } catch (e) {
                httpCode = 500
                body = "could not saved the presentation"
                console.error(e)
            }
            break
        default :
            httpCode = 405
            body = "invalid http method"
    }
    response.status(httpCode).json(body)
}