// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidationPathId, RevalidationResponseBody} from "../../../types/Revalidation"

export default async function handler(request: NextApiRequest, response: NextApiResponse<RevalidationResponseBody>) {
    const queryParams = request.query

    let httpCode: number
    let body: RevalidationResponseBody

    if (queryParams.secret !== process.env.REVALIDATION_TOKEN) {
        httpCode = 401
        body = {message: 'Invalid token'}
    } else {
        const pathIds = queryParams.ids
        if (!pathIds || pathIds.length === 0) {
            httpCode = 400
            body = {message: 'path ids missed'}
        } else {
            for (const pathId of pathIds) {
                const path = getPath(pathId)
                if (!path) {

                } else {
                    try {
                        await response.unstable_revalidate(path)
                        httpCode = 200
                        body = {message: 'successfully revalidated'}
                    } catch (err) {
                        // If there was an error, Next.js will continue
                        // to show the last successfully generated page
                        httpCode = 500
                        body = {message: 'Error revalidating'}
                    }
                }
            }
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
