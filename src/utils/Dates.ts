export const countTimeFromDate = (fromDate: Date, setCountedTime: (timeInfo: { years?: number, months?: number, days?: number, hours: number, minutes: number, seconds: number }) => void) => {

    setInterval(() => {
        const timeTillDate = Date.now() - fromDate.getTime()
        const seconds = Math.floor(timeTillDate / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        setCountedTime({hours: hours, minutes: minutes % 60, seconds: seconds % 60})
    }, 500)
}