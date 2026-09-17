"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countTimeFromDate = void 0;
const countTimeFromDate = (fromDate, whatUnitsCount, setCountedTime) => {
    setInterval(() => {
        const timeTillDate = Date.now() - fromDate.getTime();
        const countedTime = {};
        switch (true) {
            case whatUnitsCount.seconds:
                countedTime["seconds"] = Math.floor(timeTillDate / 1000 % 60);
            case whatUnitsCount.minutes:
                countedTime["minutes"] = Math.floor(timeTillDate / 1000 / 60 % 60);
            case whatUnitsCount.hours:
                countedTime["hours"] = Math.floor(timeTillDate / 1000 / 60 / 60 % 24);
            case whatUnitsCount.days:
                countedTime["days"] = Math.floor(timeTillDate / 1000 / 60 / 60 / 24);
        }
        setCountedTime(countedTime);
    }, 500);
};
exports.countTimeFromDate = countTimeFromDate;
