export type RevalidatedPath = {
    pathId: string
    revalidated: boolean
    message: string
}

export type RevalidationResponseBody = {
    revalidationsStates?: RevalidatedPath[]
    errorMessage?: string
}

export enum RevalidationPathId {
    HOME = "H", EDIT_HOME = "EH"
}