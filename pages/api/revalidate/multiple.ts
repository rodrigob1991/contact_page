import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidatedRoute, RevalidationResponseBody, RevalidationRouteId} from "../../../types/Revalidation"
import {HOME_ROUTE} from "../../index"
import {EDITH_HOME_ROUTE} from "../../user/edit_home"

const REVALIDATION_API_ROUTE = "api/revalidate/multiple"

const URL = process.env.NEXT_PUBLIC_BASE_URL + "/" + REVALIDATION_API_ROUTE

export const revalidatePages = async (pagesId: RevalidationRouteId[]) => {
    const result: {succeed: boolean, revalidations?: RevalidatedRoute[], errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(`${URL}?secret=${process.env.NEXT_PUBLIC_REVALIDATION_TOKEN}&ids=${pagesId}`)
        const body: RevalidationResponseBody = await response.json()
        if (response.ok) {
            result.revalidations = body.revalidationsStates
        } else {
            result.errorMessage = body.errorMessage
        }
        result.succeed = response.ok

    } catch (e) {
        console.error(`Error consuming revalidating endpoint: ${e}`)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<RevalidationResponseBody>) {
    const queryParams = request.query

    let httpCode: number
    let body: RevalidationResponseBody

    if (queryParams.secret !== process.env.NEXT_PUBLIC_REVALIDATION_TOKEN) {
        httpCode = 401
        body = {errorMessage: "invalid token"}
    } else {
        const routesIds = (queryParams.ids as string ).split(",")
        if (!routesIds || routesIds.length === 0) {
            httpCode = 400
            body = {errorMessage: "path ids missed"}
        } else {
            const revalidationsStates: RevalidatedRoute[] = []

            for (const routeId of routesIds) {
                const revalidationState = {routeId: routeId, revalidated: false, message: ""}
                const route = getRoute(routeId)
                if (!route) {
                    revalidationState.message = "does not exit a route with this id"
                } else {
                    try {
                        await response.unstable_revalidate(route)
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

const getRoute = (routeId: string) => {
    let route
    switch (routeId) {
        case RevalidationRouteId.HOME:
            route = HOME_ROUTE
            break
        case RevalidationRouteId.EDIT_HOME:
            route = EDITH_HOME_ROUTE
    }
    return route
}
