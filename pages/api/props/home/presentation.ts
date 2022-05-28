import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {PresentationComponent, PresentationPutParam} from "../../../../types/Home"

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: any

    switch (request.method) {
        case "PUT" :
            const presentation: PresentationPutParam = params
            if (!validPresentation(presentation)) {
                httpCode = 400
                body = "missing data"
            } else {
                try {
                    const savedPresentation = await propsStorageClient.setPresentation(presentation as PresentationComponent)
                    httpCode = 200
                    body = savedPresentation
                } catch (e) {
                    httpCode = 500
                    body = "could not saved the presentation"
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

const validPresentation = (presentation: PresentationPutParam) => {
    return presentation !== undefined && presentation.name !== undefined
        && presentation.name.length > 0 && presentation.introduction !== undefined
        && presentation.introduction.length > 0
}