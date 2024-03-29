import {NextApiRequest, NextApiResponse} from "next"
import {PropsStorageClient} from "../../../../classes/PropsStorageClient"
import {CreateHomePropsArgs, HomeProps, UpdateHomePropsArgs} from "../../../../types/home"
import {ApiParamsValidator} from "../../../../classes/ApiParamsValidator"
import {ProtectedApiBaseRoute} from "../../../../baseRoutes"
import {AuthResponseBody} from "../../internal/unauthorized"

export const HomePropsApiRoute = ProtectedApiBaseRoute + "/props/home"

//const URL = process.env.NEXT_PUBLIC_BASE_URL + HOME_PROPS_API_ROUTE

type ResponseBody = { homeProps?: HomeProps, errorMessage?: string }
type ProcessResponseResult = { succeed: boolean} & ResponseBody

const setHomeProps = async (body: CreateHomePropsArgs | UpdateHomePropsArgs, method: "POST" | "PATCH") => {
    const result: ProcessResponseResult = {succeed: false}

    try {
        const response = await fetch(window.location.origin + HomePropsApiRoute, {
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
                result.homeProps = responseBody.homeProps
            } else {
                result.errorMessage = responseBody.errorMessage
            }
        }
    } catch (e) {
        result.errorMessage = "error: " + JSON.stringify(e)
    }

    return result
}
export const postHomeProps = (body: CreateHomePropsArgs) => {
    return setHomeProps(body, "POST")
}
export const patchHomeProps = (body: UpdateHomePropsArgs) => {
    return setHomeProps(body, "PATCH")
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const requestBody = request.body

    let httpCode: number
    let body: ResponseBody

    const propsStorageClient = new PropsStorageClient()

    switch (request.method) {
        case "POST" :
            if (!requestBody || !ApiParamsValidator.areValidCreateHomePropsArgs(requestBody)) {
                httpCode = 400
                body = {errorMessage: "invalid create home props request body"}
            } else {
                try {
                    const createdHomeProps = await propsStorageClient.createHomeProps(requestBody)
                    httpCode = 200
                    body = {homeProps: createdHomeProps}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not create home props"}
                    console.error(e)
                }
            }
            break
        case "PATCH" :
            if (!requestBody || !ApiParamsValidator.areValidUpdateHomePropsArgs(requestBody)) {
                httpCode = 400
                body = {errorMessage: "invalid update home props request body"}
            } else {
                try {
                    const updatedHomeProps = await propsStorageClient.updateHomeProps(requestBody)
                    httpCode = 200
                    body = {homeProps: updatedHomeProps}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not update home props"}
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
