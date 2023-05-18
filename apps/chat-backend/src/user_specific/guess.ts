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
    log as appLog, SendMessage
} from "../app"

const log = (msg: string, guessId: number) => { appLog(msg, "guess", guessId) }

export const initGuessConnection : InitUserConnection<"guess"> = async (acceptConnection, closeConnection, addConnectedGuess, removeConnectedGuess, getConnectedHosts, publishGuessMessage, handleGuessSubscriptionToMessages, getGuessCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage: SendMessage<"guess"> = (cache, ...messages) => {
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
                    key = `${keyPrefix}${getCutMessage<OutboundMessage<"guess", "mes">, "body">(message as OutboundMessageTemplate<"guess", "mes">, {body: 4}, 4)}`
                    break
                default:
                    throw new Error("invalid message prefix")
            }
            promises.push(cacheAndSendUntilAck<GetMessages<"guess", "out">>(cache, mp, key, message, guessId))
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then(() => {})
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"guess"> = (m) => {
            const {number, body, userId: hostId} = getMessageParts<InboundFromGuessMesMessage, "number" | "userId" | "body">(m, {number: 2, userId: 3, body: 4})
            const outboundToGuessSackMessage = getMessage<OutboundToGuessServerAckMessage>({prefix: "sack", number, userId: hostId})
            const outboundToHostMesMessageParts = {prefix: "mes" as "mes", number, userId: guessId, body}
            const outboundToHostMesMessageKey = `host:${hostId}:mes:${number}:${guessId}` as const
            const outboundToHostMesMessage = getMessage<InboundMessageTarget<InboundFromGuessMesMessage>>(outboundToHostMesMessageParts)
            const publishOutboundToHostMesMessage = () => publishGuessMessage<InboundMessageTarget<InboundFromGuessMesMessage>>(hostId, outboundToHostMesMessageParts)
            return [outboundToGuessSackMessage, outboundToHostMesMessageKey, outboundToHostMesMessage, publishOutboundToHostMesMessage]
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"guess"> = (a) => {
            const {originPrefix, number, userId: hostId} = getMessageParts<InboundFromGuessAckMessage, "originPrefix" | "number" | "userId">(a, {originPrefix: 2, number: 3, userId: 4})
            const outboundToGuessMessageKey = `guess:${guessId}:${originPrefix}:${number}:${hostId}` as const
            let outboundToHostUackMessageKey
            let outboundToHostUackMessage
            let publishOutboundToHostUackMessage
            if (originPrefix === messagePrefixes.mes) {
                const outboundToHostUackMessageParts = {prefix: "uack" as "uack", number, userId: guessId}
                outboundToHostUackMessageKey = `host:${hostId}:uack:${number}:${guessId}` as const
                outboundToHostUackMessage = getMessage<OutboundToHostUserAckMessage>(outboundToHostUackMessageParts)
                publishOutboundToHostUackMessage = () => publishGuessMessage<OutboundToHostUserAckMessage>(hostId, outboundToHostUackMessageParts)
            }
            return [originPrefix, outboundToGuessMessageKey, outboundToHostUackMessageKey, outboundToHostUackMessage, publishOutboundToHostUackMessage]
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage, guessId)
    }

    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE GUESS FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeConnectedGuess(guessId), unsubscribe(), publishGuessMessage<OutboundToHostDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: guessId})])
            .then(results => {results.forEach(r => {if (r.status === "rejected") log("failure on disconnection, " + r.reason, guessId)})})
        log(`disconnected, reason code:${reasonCode}, description: ${description}`, guessId)
    }

    let subscribe
    let unsubscribe: UnsubscribeToMessages = () => Promise.resolve()

    let guessId = -1
    let connectionDate = -1
    let connectionAccepted = false
    try {
        ({id: guessId, date: connectionDate} = await addConnectedGuess())
        acceptConnection(true, handleInboundMessage, handleDisconnection,  undefined, guessId)
        connectionAccepted = true
    } catch (e) {
        acceptConnection(false, undefined, undefined, e as string, guessId)
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(guessId, sendOutboundMessage)
            await Promise.all([
                subscribe(),
                // send outbound message if host is connected
                getConnectedHosts(guessId).then(hostsIds => sendOutboundMessage(true, ...hostsIds.map(([hostId, date]) => getMessage<OutboundToGuessConMessage>({prefix: "con", number: date, userId: hostId})))),
                ...Object.values(getGuessCachedMessages(guessId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish guess connection
                publishGuessMessage<OutboundToHostConMessage>(undefined,{prefix: "con", number: connectionDate,userId: guessId})])
        } catch (e) {
            closeConnection(e as string, guessId)
        }
}