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
    log as appLog, SendMessage
} from "../app"
import {InitUserConnection} from "./types"

const log = (msg: string) => { appLog(msg, "host") }

export const initHostConnection : InitUserConnection<"host">  = async (acceptConnection, closeConnection, newHost, removeHost, getGuesses, publishHostMessage, handleHostSubscriptionToMessages, getHostCachedMesMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage : SendMessage<"host"> = (cache, ...messages) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `host:` as const
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
            promises.push(cacheAndSendUntilAck<GetMessages<"host", "out">>(cache, key, message))
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then(() => {})
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"host"> = (m) => {
            const {number, guessId, body} = getMessageParts<InboundFromHostMesMessage, "number" | "guessId" | "body">(m, {number: 2, guessId: 3, body: 4})
            const outboundToHostSackMessage = getMessage<OutboundToHostServerAckMessage>({prefix: "sack", number, guessId})
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}` as const
            const outboundToGuessMesMessageParts = {prefix: "mes" as "mes", number, body}
            const outboundToGuessMesMessage = getMessage<InboundMessageTarget<InboundFromHostMesMessage>>(outboundToGuessMesMessageParts)
            const publishOutboundToGuessMesMessage = () => publishHostMessage<InboundMessageTarget<InboundFromHostMesMessage>>(outboundToGuessMesMessageParts, guessId)
            return [outboundToHostSackMessage, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage]
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
            const {originPrefix, number, guessId} = getMessageParts<InboundFromHostAckMessage, "number" | "guessId" | "originPrefix">(a, {originPrefix: 2, number: 3, guessId: 4})
            const outboundToHostMessageKey = `host:${originPrefix}:${number}:${guessId}` as const
            let outboundToGuessUackMessageKey
            let outboundToGuessUackMessage
            let publishOutboundToGuessUackMessage
            if (originPrefix === messagePrefixes.mes) {
                const uackMessageParts = {prefix: "uack" as "uack", number}
                outboundToGuessUackMessageKey = `guess:${guessId}:uack:${number}` as const
                outboundToGuessUackMessage = getMessage<OutboundToGuessUserAckMessage>(uackMessageParts)
                publishOutboundToGuessUackMessage = () => publishHostMessage<OutboundToGuessUserAckMessage>(uackMessageParts, guessId)
            }
            return [outboundToHostMessageKey, outboundToGuessUackMessageKey, outboundToGuessUackMessage, publishOutboundToGuessUackMessage]
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage)
    }
    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        Promise.allSettled([removeHost(), unsubscribe(), publishHostMessage<OutboundToGuessDisMessage>({prefix: "dis", number: Date.now()}, undefined)])
            .then(results => {results.forEach(r => {if (r.status === "rejected") log("failure on disconnection, " + r.reason)})})
        log(`disconnected, reason code:${reasonCode}, description: ${description}`)
    }

    let subscribe
    let unsubscribe: UnsubscribeToMessages = () => Promise.resolve()

    let connectionAccepted = false
    try {
        await newHost()
        acceptConnection(true, handleInboundMessage, handleDisconnection, undefined)
        connectionAccepted = true
    } catch (e) {
        acceptConnection(false, undefined, undefined, e as string)
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] =  handleHostSubscriptionToMessages(sendOutboundMessage)
            await Promise.all([
                subscribe(),
                // send outbound message for each connected guess
                getGuesses().then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(guessId => getMessage<OutboundToHostConMessage>({prefix: "con", number: Date.now(), guessId})))),
                getHostCachedMesMessages().then(mesMessages => sendOutboundMessage(false, ...mesMessages)),
                // publish host connection
                publishHostMessage<OutboundToGuessConMessage>({number: Date.now(), prefix: "con"}, undefined)])
        } catch (e) {
            closeConnection(e as string)
        }
}
