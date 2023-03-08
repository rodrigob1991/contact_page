import type {NextRequest} from 'next/server'
import {NextFetchEvent, NextResponse} from "next/server"
import {Error404Route} from "./pages/404"
import {ProtectedApiBaseRoute, UserBaseRoute} from "./BaseRoutes"
import {UnauthorizedRoute} from "./pages/api/internal/unauthorized"

export function middleware(request: NextRequest, fetchEvent: NextFetchEvent) {
    let response: NextResponse

    if (process.env.NODE_ENV !== "production") {
        response = NextResponse.next()
    } else {
        const pathname = request.nextUrl.pathname
        const isProtectedApi = pathname.startsWith(ProtectedApiBaseRoute)
        const isUserPage = pathname.startsWith(UserBaseRoute)

        if (isProtectedApi || isUserPage) {
            const auth = request.headers.get("authorization")
            if ((auth && auth === process.env.PRIVATE_TOKEN)) {
                response = NextResponse.next()
            } else {
                let redirectUrl = request.nextUrl.origin
                if (isProtectedApi) {
                    redirectUrl += UnauthorizedRoute
                } else {
                    redirectUrl += Error404Route
                }
                response = NextResponse.redirect(redirectUrl)
            }
        } else {
            response = NextResponse.next()
        }
    }
    return response
}