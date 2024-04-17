// to be treat as a module
export {}

declare global {
    interface Window {
        modifyImageElement: (event: MouseEvent<HTMLImageElement>) => void
    }
}