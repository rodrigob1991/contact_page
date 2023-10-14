"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomColor = exports.getRandomInt = void 0;
// max and min are inclusive in the result
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
};
exports.getRandomInt = getRandomInt;
const getRandomColor = () => {
    let r, g, b, brightness;
    do {
        // generate random values for R, G y B
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
        // calculate the resulted brightness
        brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } while (brightness < 0.22);
    const rgb = (r << 16) + (g << 8) + b;
    // return the color on RGB format
    return `#${rgb.toString(16)}`;
};
exports.getRandomColor = getRandomColor;
