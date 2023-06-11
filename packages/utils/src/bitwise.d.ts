export type Bits = {
    value: number;
    length: number;
};
export declare const sumRightBits: ({ value, length }: Bits) => number;
export declare const joinBits: (...bitsArray: Bits[]) => number;
