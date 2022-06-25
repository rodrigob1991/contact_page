export type WhatUnitsCount = { days?: boolean, hours?: boolean, minutes?: boolean, seconds?: boolean }
export type CountedTime = { [U in keyof WhatUnitsCount]: number }

export const countTimeFromDate = (fromDate: Date, whatUnitsCount: WhatUnitsCount, setCountedTime: (timeInfo: CountedTime) => void) => {

    setInterval(() => {
        const timeTillDate = Date.now() - fromDate.getTime()

        const countedTime: CountedTime = {}
        switch (true) {
            case whatUnitsCount.seconds:
                countedTime["seconds"] = Math.floor(timeTillDate / 1000 % 60)
            case whatUnitsCount.minutes:
                countedTime["minutes"] = Math.floor(timeTillDate / 1000 / 60 % 60)
            case whatUnitsCount.hours:
                countedTime["hours"] = Math.floor(timeTillDate / 1000 / 60 / 60 % 24)
            case whatUnitsCount.days:
                countedTime["days"] = Math.floor(timeTillDate / 1000 / 60 / 60 / 24)
        }

        setCountedTime(countedTime)
    }, 500)
}