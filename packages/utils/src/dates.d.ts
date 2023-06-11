export type WhatUnitsCount = {
    days?: boolean;
    hours?: boolean;
    minutes?: boolean;
    seconds?: boolean;
};
export type CountedTime = {
    [U in keyof WhatUnitsCount]: number;
};
export declare const countTimeFromDate: (fromDate: Date, whatUnitsCount: WhatUnitsCount, setCountedTime: (timeInfo: CountedTime) => void) => void;
