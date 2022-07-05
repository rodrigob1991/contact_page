import {NextFetchEvent, NextRequest, NextResponse} from "next/server"
import {ROUTE_ERROR_404} from "../404"

export function middleware(request: NextRequest, ev: NextFetchEvent) {
    let response: NextResponse

    const auth = request.headers.get("authorization")
    if (auth && auth === process.env.PRIVATE_TOKEN) {
        response = NextResponse.next()
    } else {
        response = NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL + ROUTE_ERROR_404)
    }
    return response
}