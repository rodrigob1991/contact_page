"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const constants_1 = require("../../model/constants");
const functions_1 = require("../../message/functions");
const { con: conPrefix, dis: disPrefix, mes: mesPrefix, sack: sackPrefix, uack: uackPrefix } = constants_1.messagePrefixes;
const hardcodeParts = { originPrefix: "mes", number: 2346544, userId: 1522, body: "something to say" };
const { originPrefix, number, userId, body } = hardcodeParts;
const equalParts = (expectedParts, gotParts, prefix, userType, flow) => {
    (0, globals_1.test)(`message parts do not matches the message ${flow}bound ${prefix} ${userType}`, () => {
        (0, globals_1.expect)(expectedParts).toEqual(gotParts);
    });
};
const conToGuessMessage = `${conPrefix}:${number}:${userId}`;
const expectedConToGuessMessageParts = { prefix: conPrefix, number: number, userId: userId };
const gotConToGuessMessageParts = (0, functions_1.getMessageParts)(conToGuessMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedConToGuessMessageParts, gotConToGuessMessageParts, "con", "guess", "out");
const disToGuessMessage = `${disPrefix}:${number}:${userId}`;
const expectedDisToGuessMessageParts = { prefix: disPrefix, number: number, userId: userId };
const gotDisToGuessMessageParts = (0, functions_1.getMessageParts)(disToGuessMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedDisToGuessMessageParts, gotDisToGuessMessageParts, "dis", "guess", "out");
const mesToGuessMessage = `${mesPrefix}:${number}:${userId}:${body}`;
const expectedMesToGuessMessageParts = { prefix: mesPrefix, number: number, userId: userId, body: body };
const gotMesToGuessMessageParts = (0, functions_1.getMessageParts)(mesToGuessMessage, { prefix: 1, number: 2, userId: 3, body: 4 });
equalParts(expectedMesToGuessMessageParts, gotMesToGuessMessageParts, "mes", "guess", "out");
const uackToGuessMessage = `${uackPrefix}:${number}:${userId}`;
const expectedUackToGuessMessageParts = { prefix: uackPrefix, number: number, userId: userId };
const gotUackToGuessMessageParts = (0, functions_1.getMessageParts)(uackToGuessMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedUackToGuessMessageParts, gotUackToGuessMessageParts, "uack", "guess", "out");
const sackToGuessMessage = `${sackPrefix}:${number}:${userId}`;
const expectedSackToGuessMessageParts = { prefix: sackPrefix, number: number, userId: userId };
const gotSackToGuessMessageParts = (0, functions_1.getMessageParts)(sackToGuessMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedSackToGuessMessageParts, gotSackToGuessMessageParts, "sack", "guess", "out");
const conToHostMessage = `${conPrefix}:${number}:${userId}`;
const expectedConToHostMessageParts = { prefix: conPrefix, number: number, userId: userId };
const gotConToHostMessageParts = (0, functions_1.getMessageParts)(conToHostMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedConToHostMessageParts, gotConToHostMessageParts, "con", "host", "out");
const disToHostMessage = `${disPrefix}:${number}:${userId}`;
const expectedDisToHostMessageParts = { prefix: disPrefix, number: number, userId: userId };
const gotDisToHostMessageParts = (0, functions_1.getMessageParts)(disToHostMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedDisToHostMessageParts, gotDisToHostMessageParts, "dis", "host", "out");
const mesToHostMessage = `${mesPrefix}:${number}:${userId}:${body}`;
const expectedMesToHostMessageParts = { prefix: mesPrefix, number: number, userId: userId, body: body };
const gotMesToHostMessageParts = (0, functions_1.getMessageParts)(mesToHostMessage, { prefix: 1, number: 2, userId: 3, body: 4 });
equalParts(expectedMesToHostMessageParts, gotMesToHostMessageParts, "mes", "host", "out");
const uackToHostMessage = `${uackPrefix}:${number}:${userId}`;
const expectedUackToHostMessageParts = { prefix: uackPrefix, number: number, userId: userId };
const gotUackToHostMessageParts = (0, functions_1.getMessageParts)(uackToHostMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedUackToHostMessageParts, gotUackToHostMessageParts, "uack", "host", "out");
const sackToHostMessage = `${sackPrefix}:${number}:${userId}`;
const expectedSackToHostMessageParts = { prefix: sackPrefix, number: number, userId: userId };
const gotSackToHostMessageParts = (0, functions_1.getMessageParts)(sackToHostMessage, { prefix: 1, number: 2, userId: 3 });
equalParts(expectedSackToHostMessageParts, gotSackToHostMessageParts, "sack", "host", "out");
const mesFromGuessMessage = `${mesPrefix}:${number}:${userId}:${body}`;
const expectedMesFromGuessMessageParts = { prefix: mesPrefix, number: number, userId: userId, body: body };
const gotMesFromGuessMessageParts = (0, functions_1.getMessageParts)(mesFromGuessMessage, { prefix: 1, number: 2, userId: 3, body: 4 });
equalParts(expectedMesFromGuessMessageParts, gotMesFromGuessMessageParts, "mes", "guess", "in");
const ackFromGuessMessage = `${uackPrefix}:${originPrefix}:${number}:${userId}`;
const expectedAckFromGuessMessageParts = { prefix: uackPrefix, originPrefix: originPrefix, number: number, userId: userId };
const gotAckFromGuessMessageParts = (0, functions_1.getMessageParts)(ackFromGuessMessage, { prefix: 1, originPrefix: 2, number: 3, userId: 4 });
equalParts(expectedAckFromGuessMessageParts, gotAckFromGuessMessageParts, "uack", "guess", "in");
const mesFromHostMessage = `${mesPrefix}:${number}:${userId}:${body}`;
const expectedMesFromHostMessageParts = { prefix: mesPrefix, number: number, userId: userId, body: body };
const gotMesFromHostMessageParts = (0, functions_1.getMessageParts)(mesFromHostMessage, { prefix: 1, number: 2, userId: 3, body: 4 });
equalParts(expectedMesFromHostMessageParts, gotMesFromHostMessageParts, "mes", "host", "in");
const ackFromHostMessage = `${uackPrefix}:${originPrefix}:${number}:${userId}`;
const expectedAckFromHostMessageParts = { prefix: uackPrefix, originPrefix: originPrefix, number: number, userId: userId };
const gotAckFromHostMessageParts = (0, functions_1.getMessageParts)(ackFromHostMessage, { prefix: 1, originPrefix: 2, number: 3, userId: 4 });
equalParts(expectedAckFromHostMessageParts, gotAckFromHostMessageParts, "uack", "host", "in");
