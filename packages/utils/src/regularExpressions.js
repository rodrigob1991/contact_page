"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstCharAfterEqualAndSpaces = void 0;
// catch the first character after = and any number of spaces
// does not work in Safari and in other too probably
exports.firstCharAfterEqualAndSpaces = /(?<=([=]([\s]+)?))[\S]/;
