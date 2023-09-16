"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecord = void 0;
const isRecord = (v) => typeof v === "object" && !Array.isArray(v);
exports.isRecord = isRecord;
