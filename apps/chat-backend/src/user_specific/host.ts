import {RedisMessageKey} from "../redis"
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
import {HandleDisconnection, HandleInboundAckMessage, HandleInboundMesMessage, HandleInboundMessage, log as appLog} from "../app"
import {InitUserConnection} from "./types"

const log = (msg: string) => { appLog(msg, "host") }

export const initHostConnection : InitUserConnection<"host">  = async (acceptConnection, closeConnection, newHost, removeHost, getGuesses, publishHostMessage, subscribeHostToMessages, getHostCachedMesMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage = (...messages: OutboundMessageTemplate<"host">[]) => {
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
            promises.push(cacheAndSendUntilAck<GetMessages<"host", "out">>(key, message))
        }
        return Promise.all(promises).then(() => {})
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"host"> = (m) => {
            const {number, guessId: toGuessId, body} = getMessageParts<InboundFromHostMesMessage, "number" | "guessId" | "body">(m, {number: 2, guessId: 3, body: 4})
            publishHostMessage<InboundMessageTarget<InboundFromHostMesMessage>>({prefix: "mes", number: number, body: body}, toGuessId)
            return getMessage<OutboundToHostServerAckMessage>({prefix: "sack", number: number, guessId: toGuessId})
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
            const {originPrefix, number, guessId: fromGuessId} = getMessageParts<InboundFromHostAckMessage, "number" | "guessId" | "originPrefix">(a, {originPrefix: 2, number: 3, guessId: 4})
            if (originPrefix === messagePrefixes.mes) {
                publishHostMessage<OutboundToGuessUserAckMessage>({prefix: "uack", number: number}, fromGuessId)
            }
            return `host:${originPrefix}:${number}:${fromGuessId}`
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage)
    }

    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        log(`disconnected, reason code:${reasonCode}, description: ${description}`)
        publishHostMessage<OutboundToGuessDisMessage>({prefix: "dis", number: Date.now()},undefined)
        removeHost()
    }

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
            await Promise.all([
                subscribeHostToMessages(sendOutboundMessage),
                // send outbound message for each connected guess
                getGuesses().then(guessesIds => sendOutboundMessage(...guessesIds.map(guessId => getMessage<OutboundToHostConMessage>({prefix: "con", number: Date.now(), guessId: guessId})))),
                getHostCachedMesMessages().then(mesMessages => sendOutboundMessage(...mesMessages)),
                // publish host connection
                publishHostMessage<OutboundToGuessConMessage>({number: Date.now(), prefix: "con"}, undefined)])
        } catch (e) {
            closeConnection(e as string)
        }
}
