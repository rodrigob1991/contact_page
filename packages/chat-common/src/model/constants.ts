export const userTypes = {host: "host", guess: "guess"} as const
export const oppositeUserTypes = {host: userTypes.guess, guess: userTypes.host} as const
export const emptyUser = {id: -1, name: ""}
export const emptyHost = {...emptyUser, password: ""}
export const emptyGuess = {...emptyUser}
export const messageFlows = {in: "in", out: "out"} as const
export const messagePrefixesBothFlows = {mes: "mes", uack: "uack"} as const
export const messagePrefixesOut = {...messagePrefixesBothFlows, con: "con", dis: "dis", sack: "sack", usrs: "usrs"} as const
export const messagePrefixesIn = {...messagePrefixesBothFlows} as const
export const messagePrefixes = {...messagePrefixesIn, ...messagePrefixesOut} as const
export const messageParts = {prefix: "prefix", originPrefix: "originPrefix", number: "number", userId: "userId", body: "body"} as const

export const paths = {host: "/host", guess: "/guess"} as const