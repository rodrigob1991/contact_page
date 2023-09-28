// max and min are inclusive in the result
export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export const getRandomColor = () => {
    let r, g, b, brightness
    do {
        // generate random values for R, G y B
        r = Math.floor(Math.random() * 256)
        g = Math.floor(Math.random() * 256)
        b = Math.floor(Math.random() * 256)

        // calculate the resulted brightness
        brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
    } while (brightness < 0.22)

    const rgb = (r << 16) + (g << 8) + b
    // return the color on RGB format
    return `#${rgb.toString(16)}`
}