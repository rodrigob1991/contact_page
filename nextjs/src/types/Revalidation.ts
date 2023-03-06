export type RevalidatedRoute = {
    routeId: string
    revalidated: boolean
    message: string
}

export type RevalidationResponseBody = {
    revalidationsStates?: RevalidatedRoute[]
    errorMessage?: string
}

export enum RevalidationRouteId {
    HOME = "H", EDIT_HOME = "EH"
}