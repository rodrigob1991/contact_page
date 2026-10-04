// catch the first character after = and any number of spaces
// does not work in Safari and in other too probably
export const firstCharAfterEqualAndSpaces = /(?<=([=]([\s]+)?))[\S]/g
export const numberRgx = /([0-9]+[.]{1}[0-9]+)|[0-9]+/g