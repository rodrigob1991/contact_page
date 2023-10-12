export declare const userTypes: {
    readonly host: "host";
    readonly guess: "guess";
};
export declare const oppositeUserTypes: {
    readonly host: "guess";
    readonly guess: "host";
};
export declare const emptyUser: {
    id: number;
    name: string;
};
export declare const emptyHost: {
    password: string;
    id: number;
    name: string;
};
export declare const emptyGuess: {
    id: number;
    name: string;
};
export declare const messageFlows: {
    readonly in: "in";
    readonly out: "out";
};
export declare const messagePrefixesBothFlows: {
    readonly mes: "mes";
    readonly uack: "uack";
};
export declare const messagePrefixesOut: {
    readonly con: "con";
    readonly dis: "dis";
    readonly sack: "sack";
    readonly usrs: "usrs";
    readonly mes: "mes";
    readonly uack: "uack";
};
export declare const messagePrefixesIn: {
    readonly mes: "mes";
    readonly uack: "uack";
};
export declare const messagePrefixes: {
    readonly con: "con";
    readonly dis: "dis";
    readonly sack: "sack";
    readonly usrs: "usrs";
    readonly mes: "mes";
    readonly uack: "uack";
};
export declare const messageParts: {
    readonly prefix: "prefix";
    readonly originPrefix: "originPrefix";
    readonly number: "number";
    readonly userId: "userId";
    readonly body: "body";
};
export declare const paths: {
    readonly host: "/host";
    readonly guess: "/guess";
};
