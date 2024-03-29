import type {NextApiRequest, NextApiResponse} from 'next'
import {RevalidatedRoute, RevalidationResponseBody, RevalidationRouteId} from "../../../../types/revalidation"
import {ProtectedApiBaseRoute} from "../../../../baseRoutes"
import {HomeRoute} from "../../../index"
import {EditHomeRoute} from "../../../user/edit_home"
import {AuthResponseBody} from "../../internal/unauthorized"

const REVALIDATION_API_ROUTE = ProtectedApiBaseRoute + "/revalidate/multiple"

//const URL = process.env.NEXT_PUBLIC_BASE_URL + "/" + REVALIDATION_API_ROUTE

export const revalidatePages = async (pagesId: RevalidationRouteId[]) => {
    const result: { succeed: boolean, revalidations?: RevalidatedRoute[], errorMessage?: string } = {succeed: false}

    try {
        const response = await fetch(`${window.location.origin + REVALIDATION_API_ROUTE}?ids=${pagesId}`)

        result.succeed = response.ok

        if (response.status === 401) {
            const authBody: AuthResponseBody = await response.json()
            result.errorMessage = authBody
        } else {
            const revalidationBody: RevalidationResponseBody = await response.json()
            if (response.ok) {
                result.revalidations = revalidationBody.revalidationsStates
            } else {
                result.errorMessage = revalidationBody.errorMessage
            }
        }
    } catch (e) {
        result.errorMessage = "error: " + JSON.stringify(e)
    }

    return result
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<RevalidationResponseBody>) {
    let httpCode: number
    let body: RevalidationResponseBody

    const routesIds = (request.query.ids as string).split(",")
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
                    await response.revalidate(route)
                    revalidationState.revalidated = true
                    revalidationState.message = "successfully revalidated"
                } catch (error) {
                    console.error(error)
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
    response.status(httpCode).json(body)
}

const getRoute = (routeId: string) => {
    let route
    switch (routeId) {
        case RevalidationRouteId.HOME:
            route = HomeRoute
            break
        case RevalidationRouteId.EDIT_HOME:
            route = EditHomeRoute
    }
    return route
}
