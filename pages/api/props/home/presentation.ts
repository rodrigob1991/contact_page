import {NextApiRequest, NextApiResponse} from "next"
import {propsStorageClient} from "../../../../classes/Props"
import {Presentation, PresentationComponent, PresentationPutParam} from "../../../../types/Home"
import path from "path";

const ENDPOINT = `${process.env.BASE_URL}/${path.relative("/pages","./")}`

type PutBodyResponse = {
    presentation?: Presentation
    errorMessage?: string
}

export const putPresentation = async (presentation: PresentationComponent) => {
    const result: { succeed: boolean, presentation?: Presentation, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(ENDPOINT, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(presentation),
        })

        result.succeed = response.ok

        const body: PutBodyResponse = await response.json()

        if (response.ok) {
            result.presentation = body.presentation
        } else {
            result.errorMessage = body.errorMessage
        }

    } catch (e) {
        console.error(`Error getting response: ${e}`)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const params = request.body

    let httpCode: number
    let body: PutBodyResponse | string

    switch (request.method) {
        case "PUT" :
            const presentation: PresentationPutParam = params
            if (!validPresentation(presentation)) {
                httpCode = 400
                body = {errorMessage: "missing data"}
            } else {
                try {
                    const savedPresentation = await propsStorageClient.setPresentation(presentation as PresentationComponent)
                    httpCode = 200
                    body = {presentation: savedPresentation}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not saved the presentation"}
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