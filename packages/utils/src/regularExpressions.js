"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberRgx = exports.firstCharAfterEqualAndSpaces = void 0;
// catch the first character after = and any number of spaces
// does not work in Safari and in other too probably
exports.firstCharAfterEqualAndSpaces = /(?<=([=]([\s]+)?))[\S]/g;
exports.numberRgx = /([0-9]+[.]{1}[0-9]+)|[0-9]+/g;
