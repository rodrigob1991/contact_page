import {expect, test} from "@jest/globals"
import {MessagePrefix} from "../../model/types"
import {
    GotAllMessageParts,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage, InboundFromHostAckMessage, InboundFromHostMesMessage, Message,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessMesMessage, OutboundToGuessServerAckMessage, OutboundToGuessUserAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostMesMessage, OutboundToHostServerAckMessage, OutboundToHostUserAckMessage
} from "../../message/types"
import {messagePrefixes} from "../../model/constants"
import {getMessageParts} from "../../message/functions"

const {con: conPrefix, dis: disPrefix, mes: mesPrefix, sack: sackPrefix, uack: uackPrefix} = messagePrefixes
const hardcodeParts = {originPrefix: "mes" as MessagePrefix, number: 2346544, guessId: 1522, body: "something to say"}
const {originPrefix, number, guessId, body} = hardcodeParts

const equalParts = <M extends Message, GMP = GotAllMessageParts<M>>(expectedParts: GMP, gotParts: GMP, prefix: M["prefix"], userType: M["userType"], flow: M["flow"]) => {
    test(`message parts do not matches the message ${flow}bound ${prefix} ${userType}`, () => {
        expect(expectedParts).toEqual(gotParts)
    })
}

const conToGuessMessage: OutboundToGuessConMessage["template"] = `${conPrefix}:${number}`
const expectedConToGuessMessageParts: GotAllMessageParts<OutboundToGuessConMessage> = {prefix: conPrefix, number: number}
const gotConToGuessMessageParts = getMessageParts<OutboundToGuessConMessage>(conToGuessMessage, {prefix: 1, number: 2})
equalParts<OutboundToGuessConMessage>(expectedConToGuessMessageParts, gotConToGuessMessageParts, "con", "guess", "out")

const disToGuessMessage: OutboundToGuessDisMessage["template"] = `${disPrefix}:${number}`
const expectedDisToGuessMessageParts: GotAllMessageParts<OutboundToGuessDisMessage> = {prefix: disPrefix, number: number}
const gotDisToGuessMessageParts = getMessageParts<OutboundToGuessDisMessage>(disToGuessMessage, {prefix: 1, number: 2})
equalParts<OutboundToGuessDisMessage>(expectedDisToGuessMessageParts, gotDisToGuessMessageParts, "dis", "guess", "out")

const mesToGuessMessage: OutboundToGuessMesMessage["template"] = `${mesPrefix}:${number}:${body}`
const expectedMesToGuessMessageParts: GotAllMessageParts<OutboundToGuessMesMessage> = {prefix: mesPrefix, number: number, body: body}
const gotMesToGuessMessageParts = getMessageParts<OutboundToGuessMesMessage>(mesToGuessMessage, {prefix: 1, number: 2, body: 3})
equalParts<OutboundToGuessMesMessage>(expectedMesToGuessMessageParts, gotMesToGuessMessageParts, "mes", "guess", "out")

const uackToGuessMessage: OutboundToGuessUserAckMessage["template"] = `${uackPrefix}:${number}`
const expectedUackToGuessMessageParts: GotAllMessageParts<OutboundToGuessUserAckMessage> = {prefix: uackPrefix, number: number}
const gotUackToGuessMessageParts = getMessageParts<OutboundToGuessUserAckMessage>(uackToGuessMessage, {prefix: 1, number: 2})
equalParts<OutboundToGuessUserAckMessage>(expectedUackToGuessMessageParts, gotUackToGuessMessageParts, "uack", "guess", "out")

const sackToGuessMessage: OutboundToGuessServerAckMessage["template"] = `${sackPrefix}:${number}`
const expectedSackToGuessMessageParts: GotAllMessageParts<OutboundToGuessServerAckMessage> = {prefix: sackPrefix, number: number}
const gotSackToGuessMessageParts = getMessageParts<OutboundToGuessServerAckMessage>(sackToGuessMessage, {prefix: 1, number: 2})
equalParts<OutboundToGuessServerAckMessage>(expectedSackToGuessMessageParts, gotSackToGuessMessageParts, "sack", "guess", "out")

const conToHostMessage: OutboundToHostConMessage["template"] = `${conPrefix}:${number}:${guessId}`
const expectedConToHostMessageParts: GotAllMessageParts<OutboundToHostConMessage> = {prefix: conPrefix, number: number, guessId: guessId}
const gotConToHostMessageParts = getMessageParts<OutboundToHostConMessage>(conToHostMessage, {prefix: 1, number: 2, guessId: 3})
equalParts<OutboundToHostConMessage>(expectedConToHostMessageParts, gotConToHostMessageParts, "con", "host", "out")

const disToHostMessage: OutboundToHostDisMessage["template"] = `${disPrefix}:${number}:${guessId}`
const expectedDisToHostMessageParts: GotAllMessageParts<OutboundToHostDisMessage> = {prefix: disPrefix, number: number, guessId: guessId}
const gotDisToHostMessageParts = getMessageParts<OutboundToHostDisMessage>(disToHostMessage, {prefix: 1, number: 2, guessId: 3})
equalParts<OutboundToHostDisMessage>(expectedDisToHostMessageParts, gotDisToHostMessageParts, "dis", "host", "out")

const mesToHostMessage: OutboundToHostMesMessage["template"] = `${mesPrefix}:${number}:${guessId}:${body}`
const expectedMesToHostMessageParts: GotAllMessageParts<OutboundToHostMesMessage> = {prefix: mesPrefix, number: number, guessId: guessId, body: body}
const gotMesToHostMessageParts = getMessageParts<OutboundToHostMesMessage>(mesToHostMessage, {prefix: 1, number: 2, guessId: 3, body: 4})
equalParts<OutboundToHostMesMessage>(expectedMesToHostMessageParts, gotMesToHostMessageParts, "mes", "host", "out")

const uackToHostMessage: OutboundToHostUserAckMessage["template"] = `${uackPrefix}:${number}:${guessId}`
const expectedUackToHostMessageParts: GotAllMessageParts<OutboundToHostUserAckMessage> = {prefix: uackPrefix, number: number, guessId: guessId}
const gotUackToHostMessageParts = getMessageParts<OutboundToHostUserAckMessage>(uackToHostMessage, {prefix: 1, number: 2, guessId: 3})
equalParts<OutboundToHostUserAckMessage>(expectedUackToHostMessageParts, gotUackToHostMessageParts, "uack", "host", "out")

const sackToHostMessage: OutboundToHostServerAckMessage["template"] = `${sackPrefix}:${number}:${guessId}`
const expectedSackToHostMessageParts: GotAllMessageParts<OutboundToHostServerAckMessage> = {prefix: sackPrefix, number: number, guessId: guessId}
const gotSackToHostMessageParts = getMessageParts<OutboundToHostServerAckMessage>(sackToHostMessage, {prefix: 1, number: 2, guessId: 3})
equalParts<OutboundToHostServerAckMessage>(expectedSackToHostMessageParts, gotSackToHostMessageParts, "sack", "host", "out")

const mesFromGuessMessage: InboundFromGuessMesMessage["template"] = `${mesPrefix}:${number}:${body}`
const expectedMesFromGuessMessageParts: GotAllMessageParts<InboundFromGuessMesMessage> = {prefix: mesPrefix, number: number, body: body}
const gotMesFromGuessMessageParts = getMessageParts<InboundFromGuessMesMessage>(mesFromGuessMessage, {prefix: 1, number: 2, body: 3})
equalParts<InboundFromGuessMesMessage>(expectedMesFromGuessMessageParts, gotMesFromGuessMessageParts, "mes", "guess", "in")

const ackFromGuessMessage: InboundFromGuessAckMessage["template"] = `${uackPrefix}:${originPrefix}:${number}`
const expectedAckFromGuessMessageParts: GotAllMessageParts<InboundFromGuessAckMessage> = {prefix: uackPrefix, originPrefix: originPrefix, number: number}
const gotAckFromGuessMessageParts = getMessageParts<InboundFromGuessAckMessage>(ackFromGuessMessage, {prefix: 1,originPrefix: 2, number: 3})
equalParts<InboundFromGuessAckMessage>(expectedAckFromGuessMessageParts, gotAckFromGuessMessageParts, "uack", "guess", "in")

const mesFromHostMessage: InboundFromHostMesMessage["template"] = `${mesPrefix}:${number}:${guessId}:${body}`
const expectedMesFromHostMessageParts: GotAllMessageParts<InboundFromHostMesMessage> = {prefix: mesPrefix, number: number, guessId: guessId, body: body}
const gotMesFromHostMessageParts = getMessageParts<InboundFromHostMesMessage>(mesFromHostMessage, {prefix: 1, number: 2, guessId: 3, body: 4})
equalParts<InboundFromHostMesMessage>(expectedMesFromHostMessageParts, gotMesFromHostMessageParts, "mes", "host", "in")

const ackFromHostMessage: InboundFromHostAckMessage["template"] = `${uackPrefix}:${originPrefix}:${number}:${guessId}`
const expectedAckFromHostMessageParts: GotAllMessageParts<InboundFromHostAckMessage> = {prefix: uackPrefix, originPrefix: originPrefix, number: number, guessId: guessId}
const gotAckFromHostMessageParts = getMessageParts<InboundFromHostAckMessage>(ackFromHostMessage, {prefix: 1, originPrefix: 2, number: 3, guessId: 4})
equalParts<InboundFromHostAckMessage>(expectedAckFromHostMessageParts, gotAckFromHostMessageParts, "uack", "host", "in")