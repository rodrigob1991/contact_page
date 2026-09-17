export declare const encrypt: (secret: string, target: string) => string;
export declare const decrypt: (secret: string, target: string) => {
    succeed: boolean;
    output: string;
};
