"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstCharAfterEqualAndSpaces = void 0;
// catch the first character after = and any number of spaces
exports.firstCharAfterEqualAndSpaces = /(?<=([=]([\s]+)?))[\S]/;
