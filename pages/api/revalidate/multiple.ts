import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidatedPath, RevalidationPathId, RevalidationResponseBody} from "../../../types/Revalidation"
import {HOME_PATH} from "../../index"
import {EDITH_HOME_PATH} from "../../user/edit_home"
import path from "path"

const ENDPOINT = `${process.env.BASE_URL}/${path.relative("/pages","./")}`

export const revalidatePages = async (pagesId: RevalidationPathId[]) => {
    const url = ENDPOINT + `?secret=${process.env.REVALIDATION_TOKEN}&ids=${pagesId}`
    const response = await fetch(url)
    const body: RevalidationResponseBody = await response.json()

    return {httpCode: response.status, errorMessage: body.errorMessage, revalidations: body.revalidationsStates}
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<RevalidationResponseBody>) {
    const queryParams = request.query

    let httpCode: number
    let body: RevalidationResponseBody

    if (queryParams.secret !== process.env.REVALIDATION_TOKEN) {
        httpCode = 401
        body = {errorMessage: "invalid token"}
    } else {
        const pathIds = queryParams.ids
        if (!pathIds || pathIds.length === 0) {
            httpCode = 400
            body = {errorMessage: "path ids missed"}
        } else {
            const revalidationsStates: RevalidatedPath[] = []

            for (const pathId of pathIds) {
                const revalidationState = {pathId: pathId, revalidated: false, message: ""}
                const path = getPath(pathId)
                if (!path) {
                    revalidationState.message = "does not exit a path with this id"
                } else {
                    try {
                        await response.unstable_revalidate(path)
                        revalidationState.revalidated = true
                        revalidationState.message = "successfully revalidated"
                    } catch (err) {
                        // If there was an error, Next.js will continue
                        // to show the last successfully generated page
                        revalidationState.message = "internal error revalidating"
                    }
                }
                revalidationsStates.push(revalidationState)
            }
            httpCode = 200
            body = {revalidationsStates: revalidationsStates}
        }
    }
    response.status(httpCode).json(body)
}

const getPath = (pathId: string) => {
    let path
    switch (pathId) {
        case RevalidationPathId.HOME:
            path = HOME_PATH
            break
        case RevalidationPathId.EDIT_HOME:
            path = EDITH_HOME_PATH
    }
    return path
}
