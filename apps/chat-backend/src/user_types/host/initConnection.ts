import {RedisMessageKey, UnsubscribeToMessages} from "../../redis"
import {
    GetMessages,
    InboundFromHostAckMessage,
    InboundFromHostMesMessage,
    InboundMessageTarget,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessUserAckMessage,
    OutboundToHostGuessesMessage,
    OutboundToHostMesMessage,
    OutboundToHostServerAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getParts, getPrefix} from "chat-common/src/message/functions"
import {
    HandleDisconnection,
    HandleInboundAckConMessage,
    HandleInboundAckDisMessage,
    HandleInboundAckMesMessage,
    HandleInboundAckUackMessage,
    HandleInboundAckUsrsMessage,
    HandleInboundMesMessage,
    HandleInboundMessage,
    log as appLog,
    logError as appLogError,
    SendMessage
} from "../../app"
import {InitUserConnection} from "../types"

const log = (msg: string, id: number) => { appLog(msg, "host", id) }
const logError = (msg: string, id: number) => { appLogError(msg, "host", id) }

export const initConnection : InitUserConnection<"host">  = async (acceptConnection, closeConnection, addConnectedHost, removeConnectedHost, getConnectedGuesses, publishMessage, handleHostSubscriptionToMessages, getHostCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage : SendMessage<"host"> = async (cache, ...messages) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `host:${hostId}:` as const
            let key: RedisMessageKey<GetMessages<"host", "out">>
            const mp = getPrefix(message)
            switch (mp) {
                case "con":
                case "dis":
                case "uack":
                    key = `${keyPrefix}${message as OutboundMessageTemplate<"host", "con" | "dis" | "uack">}`
                    break
                case "mes":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostMesMessage, "body">(message as OutboundToHostMesMessage["template"], {body: 4}, 4)}`
                    break
                case "usrs":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostGuessesMessage, "body">(message as OutboundToHostGuessesMessage["template"], {body: 3}, 3)}`
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
            const {number, userId: guessId, body} = getParts<InboundFromHostMesMessage, "number" | "userId" | "body">(m, {number: 2, userId: 3, body: 4})
            const outboundToHostSackMessage = getMessage<OutboundToHostServerAckMessage>({prefix: "sack", number, userId: guessId})
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}:${hostId}` as const
            const outboundToGuessMesMessageParts = {prefix: "mes" as const, number, userId: hostId, body}
            const outboundToGuessMesMessage = getMessage<InboundMessageTarget<InboundFromHostMesMessage>>(outboundToGuessMesMessageParts)
            const publishOutboundToGuessMesMessage = () => publishMessage<InboundMessageTarget<InboundFromHostMesMessage>>(guessId, outboundToGuessMesMessageParts)
            return [outboundToHostSackMessage, guessId, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage]
        }
        /*const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
         //userId: guessId
            const {originPrefix, number} = getParts<InboundFromHostAckMessage, "number" | "originPrefix">(a, {originPrefix: 2, number: 3})
            // the key of the original message acknowledge
            const outboundToHostMessageKey = `host:${hostId}:${originPrefix}:${number}:${guessId}` as const
            let outboundToGuessUackMessageKey
            let outboundToGuessUackMessage
            let publishOutboundToGuessUackMessage
            if (originPrefix === messagePrefixes.mes) {
                const uackMessageParts = {prefix: "uack" as const, number, userId: hostId}
                outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}` as const
                outboundToGuessUackMessage = getMessage<OutboundToGuessUserAckMessage>(uackMessageParts)
                publishOutboundToGuessUackMessage = () => publishMessage<OutboundToGuessUserAckMessage>(guessId, uackMessageParts)
            }
            return [originPrefix, outboundToHostMessageKey, guessId, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage]
        }*/
        const handleInboundAckConMessage: HandleInboundAckConMessage<"host"> = (m) => {
            const {number, userId: guessId} = getParts<InboundFromHostAckMessage<"con">, "number" | "userId">(m, {number: 3, userId: 4})
            return `host:${hostId}:con:${number}:${guessId}`
        }
        const handleInboundAckDisMessage: HandleInboundAckDisMessage<"host"> = (m) => {
            const {number, userId: guessId} = getParts<InboundFromHostAckMessage<"dis">, "number" | "userId">(m, {number: 3, userId: 4})
            return `host:${hostId}:dis:${number}:${guessId}`
        }
        const handleInboundAckUsrsMessage: HandleInboundAckUsrsMessage<"host"> = (m) => {
            const {number} = getParts<InboundFromHostAckMessage<"usrs">, "number">(m, {number: 3})
            return `host:${hostId}:usrs:${number}`
        }
        const handleInboundAckUackMessage: HandleInboundAckUackMessage<"host"> = (m) => {
            const {number, userId: guessId} = getParts<InboundFromHostAckMessage<"uack">, "number" | "userId">(m, {number: 3, userId: 4})
            return `host:${hostId}:uack:${number}:${guessId}`
        }
        const handleInboundAckMesMessage: HandleInboundAckMesMessage<"host"> = (m) => {
            const {number, userId: guessId} = getParts<InboundFromHostAckMessage<"mes">, "number" | "userId">(m, {number: 3, userId: 4})

            const originOutboundMessageKey = `host:${hostId}:mes:${number}:${guessId}` as const

            const outboundToGuessUackMessageParts = {prefix: "uack" as const, number, userId: hostId}
            const outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}:${hostId}` as const
            const outboundToGuessUackMessage = getMessage<OutboundToGuessUserAckMessage>(outboundToGuessUackMessageParts)
            const publishOutboundToGuessUackMessage = () => publishMessage<OutboundToGuessUserAckMessage>(guessId, outboundToGuessUackMessageParts)

            return [originOutboundMessageKey, guessId, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage]
        }

        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, hostId)
    }
    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeConnectedHost(hostId), unsubscribe(), publishMessage<OutboundToGuessDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: hostId})])
            .then(results => {results.forEach(r => {if (r.status === "rejected") log("failure on disconnection, " + r.reason, hostId)})})
            .catch((r: string)=> { log(r, hostId) })
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
        acceptConnection(false, undefined, undefined,"error initializing host : " + JSON.stringify(e))
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] =  handleHostSubscriptionToMessages(hostId, sendOutboundMessage)
            await Promise.all([
                subscribe(),
                // send outbound message for each connected guess
                getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, getMessage<OutboundToHostGuessesMessage>({prefix: "usrs", number: connectionDate, body: getUsersMessageBody(guessesIds.map(([id, date]) => [id, true, date]))}))),
                //getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(([guessId, date]) => getMessage<OutboundToHostConMessage>({prefix: "con", number: date, userId: guessId})))),
                ...Object.values(getHostCachedMessages(hostId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish host connection
                publishMessage<OutboundToGuessConMessage>(undefined,{prefix: "con", number: connectionDate, userId: hostId})])
        } catch (e) {
            closeConnection("error initializing host : " + JSON.stringify(e))
        }
}
