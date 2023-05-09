import {
    GetMessages,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage,
    InboundMessageTarget,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToGuessServerAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostUserAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"
import {messagePrefixes} from "chat-common/src/model/constants"
import {InitUserConnection} from "./types"
import {RedisMessageKey, UnsubscribeToMessages} from "../redis"
import {
    HandleDisconnection,
    HandleInboundAckMessage,
    HandleInboundMesMessage,
    HandleInboundMessage,
    log as appLog
} from "../app"

const log = (msg: string, guessId: number) => { appLog(msg, "guess", guessId) }

export const initGuessConnection : InitUserConnection<"guess"> = async (acceptConnection, closeConnection, newGuess, removeGuess, getHost, publishGuessMessage, handleGuessSubscriptionToMessages, getGuessCachedMesMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage = (...messages: OutboundMessageTemplate<"guess">[]) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `guess:${guessId}:` as const
            let key: RedisMessageKey<GetMessages<"guess", "out">>
            const mp = getMessagePrefix(message)
            switch (mp) {
                case "con":
                case "dis":
                case "uack":
                    key = `${keyPrefix}${message as OutboundMessageTemplate<"guess", "con" | "dis" | "uack">}`
                    break
                case "mes":
                    key = `${keyPrefix}${getCutMessage<OutboundMessage<"guess", "mes">, "body">(message as OutboundMessageTemplate<"guess", "mes">, {body: 3}, 3)}`
                    break
                default:
                    throw new Error("invalid message prefix")
            }
            promises.push(cacheAndSendUntilAck<GetMessages<"guess", "out">>(key, message, guessId))
        }
        // maybe instead use Promise.allSettled
        return Promise.all(promises).then(() => {})
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"guess"> = (m) => {
            const {number, body} = getMessageParts<InboundFromGuessMesMessage, "number" | "body">(m, {number: 2, body: 3})
            publishGuessMessage<InboundMessageTarget<InboundFromGuessMesMessage>>({prefix: "mes" as "mes", number: number, guessId: guessId, body: body})
            return getMessage<OutboundToGuessServerAckMessage>({prefix: "sack", number: number})
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"guess"> = (a) => {
            const {originPrefix, number} = getMessageParts<InboundFromGuessAckMessage, "originPrefix" | "number">(a, {originPrefix: 2, number: 3})
            if (originPrefix === messagePrefixes.mes) {
                publishGuessMessage<OutboundToHostUserAckMessage>({prefix: "uack", number: number, guessId: guessId})
            }
            return `guess:${guessId}:${originPrefix}:${number}`
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage, guessId)
    }

    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        Promise.allSettled([removeGuess(guessId), unsubscribe(), publishGuessMessage<OutboundToHostDisMessage>({prefix: "dis", number: Date.now(), guessId: guessId})])
            .then(results => {results.forEach(r => {if (r.status === "rejected") log("failure on disconnection, " + r.reason, guessId)})})
        log(`disconnected, reason code:${reasonCode}, description: ${description}`, guessId)
    }

    let subscribe
    let unsubscribe: UnsubscribeToMessages = () => Promise.resolve()

    let guessId = -1
    let connectionAccepted = false
    try {
        guessId = await newGuess()
        acceptConnection(true, handleInboundMessage, handleDisconnection,  undefined, guessId)
        connectionAccepted = true
    } catch (e) {
        acceptConnection(false, undefined, undefined, e as string, guessId)
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(sendOutboundMessage, guessId)
            await Promise.all([
                subscribe(),
                // send outbound message if host is connected
                getHost(guessId).then(isHost => {if (isHost) sendOutboundMessage(getMessage<OutboundToGuessConMessage>({prefix: "con", number: Date.now()}))}),
                getGuessCachedMesMessages(guessId).then(mesMessages => sendOutboundMessage(...mesMessages)),
                // publish guess connection
                publishGuessMessage<OutboundToHostConMessage>({number: Date.now(), prefix: "con", guessId: guessId})])
        } catch (e) {
            closeConnection(e as string, guessId)
        }
}