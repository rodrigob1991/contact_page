"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writableProperty = exports.exist = exports.isEmpty = void 0;
const isEmpty = (kv) => Object.keys(kv).length === 0;
exports.isEmpty = isEmpty;
const exist = (kv) => kv !== undefined && kv !== null;
exports.exist = exist;
const writableProperty = (kv, key) => { var _a, _b; return (_b = (_a = Object.getOwnPropertyDescriptor(kv, key)) === null || _a === void 0 ? void 0 : _a.writable) !== null && _b !== void 0 ? _b : false; };
exports.writableProperty = writableProperty;
