"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecordWithNewProps = void 0;
const getRecordWithNewProps = (record, newProps) => {
    const modifyRecord = Object.assign({}, record);
    for (const [key, newProp] of newProps) {
        modifyRecord[key] = newProp;
    }
    return modifyRecord;
};
exports.getRecordWithNewProps = getRecordWithNewProps;
