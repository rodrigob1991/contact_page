// to be treat as a module
export {}

declare global {
    interface Window {
        modifyImageElement: (img: HTMLImageElement) => void
    }
}