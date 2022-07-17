import {NextApiRequest, NextApiResponse} from "next"
import {PropsStorageClient} from "../../../classes/PropsStorageClient"
import {HomeProps, SetHomeProps} from "../../../types/Home"
import {AuthResponseBody} from "../_middleware"
import {ApiParamsValidator} from "../../../classes/ApiParamsValidator"

const HOME_PROPS_API_ROUTE = "/api/props/home"

const URL = process.env.NEXT_PUBLIC_BASE_URL + HOME_PROPS_API_ROUTE

type PutResponseBody = {
    homeProps?: HomeProps
    errorMessage?: string
}

export const putHomeProps = async (homeProps: SetHomeProps) => {
    const result: { succeed: boolean, homeProps?: HomeProps, errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(homeProps),
        })

        result.succeed = response.ok

        if (response.status === 401) {
            const authBody: AuthResponseBody = await response.json()
            result.errorMessage = authBody
        } else {
            const putBody: PutResponseBody = await response.json()
            if (response.ok) {
                result.homeProps = putBody.homeProps
            } else {
                result.errorMessage = putBody.errorMessage
            }
        }
    } catch (e) {
        console.error(`Error getting response: ${e}`)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    let httpCode: number
    let body: PutResponseBody

    const propsStorageClient = new PropsStorageClient()

    switch (request.method) {
        case "PUT" :
            const params: SetHomeProps = request.body
            if (!ApiParamsValidator.areValidSetHomeProps(params)) {
                httpCode = 400
                body = {errorMessage: "invalid data"}
            } else {
                try {
                    const homeProps = await propsStorageClient.setHomeProps(params)
                    httpCode = 200
                    body = {homeProps: homeProps}
                } catch (e) {
                    httpCode = 500
                    body = {errorMessage: "could not saved home props"}
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
