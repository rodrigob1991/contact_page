import {NextApiRequest, NextApiResponse} from "next"
import {PropsStorageClient} from "../../../../../classes/PropsStorageClient"
import {ApiParamsValidator} from "../../../../../classes/ApiParamsValidator"
import {CreatePresentationArgs, Presentation, UpdatePresentationArgs} from "../../../../../types/Home"
import {HomePropsApiRoute} from "../home"
import {AuthResponseBody} from "../../../../../middleware"

const PRESENTATION_API_ROUTE = HomePropsApiRoute + "/presentation"

const URL = process.env.NEXT_PUBLIC_BASE_URL + PRESENTATION_API_ROUTE

type ResponseBody = { presentation?: Presentation, errorMessage?: string }
type ProcessResponseResult = { succeed: boolean} & ResponseBody

export const setPresentation = async (body: CreatePresentationArgs | UpdatePresentationArgs, method: "POST" | "PATCH") => {
    const result: ProcessResponseResult = {succeed: false}

    try {
        const response = await fetch(URL, {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        result.succeed = response.ok

        if (response.status === 401) {
            const authBody: AuthResponseBody = await response.json()
            result.errorMessage = authBody
        } else {
            const responseBody: ResponseBody = await response.json()
            if (response.ok) {
                result.presentation = responseBody.presentation
            } else {
                result.errorMessage = responseBody.errorMessage
            }
        }
    } catch (e) {
        console.error(`Error getting response: ${e}`)
    }

    return result
}
export const postPresentation = async (body: CreatePresentationArgs) => {
    return setPresentation(body, "POST")
}
export const patchPresentation = async (body: UpdatePresentationArgs) => {
    return setPresentation(body, "PATCH")
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const requestBody = request.body

    let httpCode: number
    let body: ResponseBody

    const propsStorageClient = new PropsStorageClient()

    switch (request.method) {
        case "POST" :
            if (!requestBody || !ApiParamsValidator.isValidCreatePresentation(requestBody)) {
                httpCode = 400
                body = {errorMessage: "invalid create presentation params"}
            } else {
                try {
                    const createdPresentation = await propsStorageClient.setPresentation(requestBody)
                    httpCode = 200
                    body = {presentation: createdPresentation}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not create the presentation"}
                    console.error(e)
                }
            }
            break
        case "PATCH" :
            if (!requestBody || !ApiParamsValidator.isValidUpdatePresentation(requestBody)) {
                httpCode = 400
                body = {errorMessage: "invalid update presentation params"}
            } else {
                try {
                    const updatedPresentation = await propsStorageClient.setPresentation(requestBody)
                    httpCode = 200
                    body = {presentation: updatedPresentation}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not update the presentation"}
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