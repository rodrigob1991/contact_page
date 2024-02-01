"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exist = exports.isEmpty = exports.getObjectWithNewProps = void 0;
const getObjectWithNewProps = (object, newProps) => {
    const modifiedObject = Object.assign({}, object);
    for (const [key, newProp] of newProps) {
        modifiedObject[key] = newProp;
    }
    return modifiedObject;
};
exports.getObjectWithNewProps = getObjectWithNewProps;
const isEmpty = (o) => Object.keys(o).length === 0;
exports.isEmpty = isEmpty;
const exist = (o) => o !== undefined && o !== null;
exports.exist = exist;
