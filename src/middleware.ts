import type {NextRequest} from 'next/server'
import ProtectedApiBaseRoute from "./pages/api/protected/BaseRoute"
import UserBaseRoute from "./pages/user/BaseRoute"
import {NextFetchEvent, NextResponse} from "next/server"
import {Error404Route} from "./pages/404"

const authResponseBody = "invalid authorization token"
export type AuthResponseBody = typeof authResponseBody

const invalidRouteResponseBody = "invalid route"

export function middleware(request: NextRequest, fetchEvent: NextFetchEvent) {
    let response: NextResponse

    const auth = request.headers.get("authorization")
    if (process.env.NODE_ENV !== "production" || (auth && auth === process.env.PRIVATE_TOKEN)) {
        response = NextResponse.next()
    } else {
        const pathname = request.nextUrl.pathname

        if (pathname.startsWith(ProtectedApiBaseRoute)) {
            response = NextResponse.json(JSON.stringify(authResponseBody), {status: 401})
        } else if (pathname.startsWith(UserBaseRoute)) {
            response = NextResponse.redirect(request.nextUrl.origin + Error404Route)
        } else {
            response = NextResponse.json(JSON.stringify(invalidRouteResponseBody), {status: 404})
        }
    }

    return response
}