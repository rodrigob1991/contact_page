import {NextApiRequest, NextApiResponse} from "next"
import {InternalApiBaseRoute} from "../../../BaseRoutes"

export const UnauthorizedRoute = InternalApiBaseRoute + "/unauthorized"

const responseBody = "invalid authorization token"
export type AuthResponseBody = typeof responseBody

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    response.status(401).json(responseBody)
}