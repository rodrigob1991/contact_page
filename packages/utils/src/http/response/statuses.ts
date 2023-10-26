export const statuses = {
    400: "Bad Request",
    401: "Unauthorized",
    500: "Internal Server Error"
}
export type StatusCode = keyof typeof statuses