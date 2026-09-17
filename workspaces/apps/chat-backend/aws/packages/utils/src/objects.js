"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.getObjectWithNewProps = void 0;
const getObjectWithNewProps = (object, newProps) => {
    const modifiedObject = Object.assign({}, object);
    for (const [key, newProp] of newProps) {
        modifiedObject[key] = newProp;
    }
    return modifiedObject;
};
exports.getObjectWithNewProps = getObjectWithNewProps;
const isEmpty = (object) => Object.keys(object).length === 0;
exports.isEmpty = isEmpty;
