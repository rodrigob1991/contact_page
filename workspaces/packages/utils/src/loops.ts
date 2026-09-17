export const doXTimes = (x: number, fn: (i: number) => void) => {
    for (let i = 1; i <= x; i++) {
        fn(i)
    }
}