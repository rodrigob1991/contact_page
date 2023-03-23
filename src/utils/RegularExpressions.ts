// catch the first character after = and any number of spaces
// does not work in Safari and in other too probably
export const firstCharAfterEqualAndSpaces = /(?<=([=]([\s]+)?))[\S]/