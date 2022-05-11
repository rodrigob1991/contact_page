// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidatedPath, RevalidationPathId, RevalidationResponseBody} from "../../../types/Revalidation"

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
                    revalidationState.message = "does not exit a path with that id"
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
            path = "/"
            break
        case RevalidationPathId.EDIT_HOME:
            path = "/user/edit_home"
    }
    return path
}
