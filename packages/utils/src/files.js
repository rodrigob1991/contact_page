"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSplitFileContent = exports.getFileContent = void 0;
const fs_1 = __importDefault(require("fs"));
const strings_1 = require("./strings");
const getFileContent = (path) => new Promise((resolve, reject) => {
    fs_1.default.readFile(path, 'utf8', (error, content) => {
        if (error) {
            reject("error opening file in" + path + ", " + error.message);
        }
        else {
            resolve(content);
        }
    });
});
exports.getFileContent = getFileContent;
const getSplitFileContent = (path, separators) => (0, exports.getFileContent)(path).then(content => (0, strings_1.recursiveSplit)(content, separators));
exports.getSplitFileContent = getSplitFileContent;
