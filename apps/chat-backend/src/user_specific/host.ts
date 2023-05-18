import {RedisMessageKey, UnsubscribeToMessages} from "../redis"
import {
    GetMessages,
    InboundFromHostAckMessage,
    InboundFromHostMesMessage,
    InboundMessageTarget,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessUserAckMessage,
    OutboundToHostConMessage,
    OutboundToHostServerAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"
import {messagePrefixes} from "chat-common/src/model/constants"
import {
    HandleDisconnection,
    HandleInboundAckMessage,
    HandleInboundMesMessage,
    HandleInboundMessage,
    log as appLog,
    SendMessage
} from "../app"
import {InitUserConnection} from "./types"

const log = (msg: string, id: number) => { appLog(msg, "host") }

export const initHostConnection : InitUserConnection<"host">  = async (acceptConnection, closeConnection, addConnectedHost, removeConnectedHost, getConnectedGuesses, publishHostMessage, handleHostSubscriptionToMessages, getHostCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage : SendMessage<"host"> = (cache, ...messages) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `host:${hostId}:` as const
            let key: RedisMessageKey<GetMessages<"host", "out">>
            const mp = getMessagePrefix(message)
            switch (mp) {
                case "con":
                case "dis":
                case "uack":
                    key = `${keyPrefix}${message as OutboundMessageTemplate<"host", "con" | "dis" | "uack">}`
                    break
                case "mes":
                    key = `${keyPrefix}${getCutMessage<OutboundMessage<"host", "mes">, "body">(message as OutboundMessageTemplate<"host", "mes">, {body: 4}, 4)}`
                    break
                default:
                    throw new Error("invalid message prefix")
            }
            promises.push(cacheAndSendUntilAck<GetMessages<"host", "out">>(cache, mp, key, message, hostId))
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then(() => {})
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"host"> = (m) => {
            const {number, userId: guessId, body} = getMessageParts<InboundFromHostMesMessage, "number" | "userId" | "body">(m, {number: 2, userId: 3, body: 4})
            const outboundToHostSackMessage = getMessage<OutboundToHostServerAckMessage>({prefix: "sack", number, userId: guessId})
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}:${hostId}` as const
            const outboundToGuessMesMessageParts = {prefix: "mes" as "mes", number, userId: hostId, body}
            const outboundToGuessMesMessage = getMessage<InboundMessageTarget<InboundFromHostMesMessage>>(outboundToGuessMesMessageParts)
            const publishOutboundToGuessMesMessage = () => publishHostMessage<InboundMessageTarget<InboundFromHostMesMessage>>(guessId, outboundToGuessMesMessageParts)
            return [outboundToHostSackMessage, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage]
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
            const {originPrefix, number, userId: guessId} = getMessageParts<InboundFromHostAckMessage, "number" | "userId" | "originPrefix">(a, {originPrefix: 2, number: 3, userId: 4})
            const outboundToHostMessageKey = `host:${hostId}:${originPrefix}:${number}:${guessId}` as const
            let outboundToGuessUackMessageKey
            let outboundToGuessUackMessage
            let publishOutboundToGuessUackMessage
            if (originPrefix === messagePrefixes.mes) {
                const uackMessageParts = {prefix: "uack" as "uack", number, userId: hostId}
                outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}` as const
                outboundToGuessUackMessage = getMessage<OutboundToGuessUserAckMessage>(uackMessageParts)
                publishOutboundToGuessUackMessage = () => publishHostMessage<OutboundToGuessUserAckMessage>(guessId, uackMessageParts)
            }
            return [originPrefix, outboundToHostMessageKey, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage]
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage)
    }
    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeConnectedHost(hostId), unsubscribe(), publishHostMessage<OutboundToGuessDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: hostId})])
            .then(results => {results.forEach(r => {if (r.status === "rejected") log("failure on disconnection, " + r.reason, hostId)})})
        log(`disconnected, reason code:${reasonCode}, description: ${description}`, hostId)
    }

    let subscribe
    let unsubscribe: UnsubscribeToMessages = () => Promise.resolve()

    let hostId = -1
    let connectionDate = -1
    let connectionAccepted = false
    try {
        ({id: hostId, date: connectionDate} = await addConnectedHost())
        acceptConnection(true, handleInboundMessage, handleDisconnection, undefined)
        connectionAccepted = true
    } catch (e) {
        acceptConnection(false, undefined, undefined, e as string)
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] =  handleHostSubscriptionToMessages(hostId, sendOutboundMessage)
            await Promise.all([
                subscribe(),
                // send outbound message for each connected guess
                getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(([guessId, date]) => getMessage<OutboundToHostConMessage>({prefix: "con", number: date, userId: guessId})))),
                ...Object.values(getHostCachedMessages(hostId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish host connection
                publishHostMessage<OutboundToGuessConMessage>(undefined,{prefix: "con", number: connectionDate, userId: hostId})])
        } catch (e) {
            closeConnection(e as string)
        }
}
