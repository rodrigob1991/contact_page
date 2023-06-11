export const getParam = (url: string, key: string) => {
    const startIndex = url.indexOf("=", url.search(key)) + 1
    const endIndex = url.indexOf("&", startIndex)
    return url.substring(startIndex, endIndex < 0 ? url.length : endIndex)
}