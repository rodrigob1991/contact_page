import {NextFetchEvent, NextRequest, NextResponse} from "next/server"

const authResponseBody = "invalid authorization token"
export type AuthResponseBody = typeof authResponseBody

export function middleware(request: NextRequest, ev: NextFetchEvent) {
    let response: Response

    const auth = request.headers.get("authorization")
    if (process.env.NODE_ENV !== "production" || (auth && auth === process.env.PRIVATE_TOKEN)) {
        response = NextResponse.next()
    } else {
        response = new Response(JSON.stringify(authResponseBody),
            {
                status: 401
            })
    }

    return response
}