import {RedisMessageKey} from "../../redis"
import {
    GetMessages,
    InboundFromHostAckMessage,
    InboundFromHostMesMessage,
    InboundMessageTarget,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessUserAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostGuessesMessage,
    OutboundToHostMesMessage,
    OutboundToHostServerAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getParts, getPrefix, getUsersMessageBody} from "chat-common/src/message/functions"
import {
    getHandleError as appGetHandleError,
    HandleDisconnection,
    HandleInboundAckConMessage,
    HandleInboundAckDisMessage,
    HandleInboundAckMesMessage,
    HandleInboundAckUackMessage,
    HandleInboundAckUsrsMessage,
    HandleInboundMesMessage,
    HandleInboundMessage,
    log as appLog,
    panic as appPanic,
    SendMessage
} from "../../app"
import {InitUserConnection} from "../types"
import {isEmpty} from "utils/src/objects"

//const logError = (msg: string, id: number) => { appLogError(msg, "host", id) }

export const initConnection : InitUserConnection<"host">  = async ({id: hostId, name: hostName, date: connectionDate}, setConnectionHandlers, removeConnectedHost, getConnectedGuesses, publishMessage, handleHostSubscriptionToMessages, getHostCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const log = (msg: string) => { appLog(msg, "host", hostId) }
    const panic = (msg: string): never => appPanic(msg, "host", hostId)
    const getHandleError = (originFunction: (...args: any[]) => any, reason2?: string, callback?: (r: string) => void) => appGetHandleError(originFunction, reason2, "host", hostId, callback)

    const sendOutboundMessage : SendMessage<"host"> = async (cache, ...messages) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `host:${hostId}:` as const
            let key: RedisMessageKey<GetMessages<"host", "out">> | undefined = undefined
            const mp = getPrefix(message)
            switch (mp) {
                case "usrs":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostGuessesMessage, "body">(message as OutboundToHostGuessesMessage["template"], {body: 3}, 3)}`
                    break
                case "con":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostConMessage, "body">(message as OutboundToHostConMessage["template"], {body: 4}, 4)}`
                    break
                case "dis":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostDisMessage, "body">(message as OutboundToHostDisMessage["template"], {body: 4}, 4)}`
                    break
                case "uack":
                    key = `${keyPrefix}${message as OutboundMessageTemplate<"host", "uack">}`
                    break
                case "mes":
                    key = `${keyPrefix}${getCutMessage<OutboundToHostMesMessage, "body">(message as OutboundToHostMesMessage["template"], {body: 4}, 4)}`
                    break
                default:
                    panic("invalid message prefix")
            }
            promises.push(cacheAndSendUntilAck<GetMessages<"host", "out">>(cache, mp, key as RedisMessageKey<GetMessages<"host", "out">>, message, hostId))
        }
        // maybe use Promise.allSettled instead
        return Promise.all(promises).then()
    }

    const [subscribe, unsubscribe] = handleHostSubscriptionToMessages(hostId, sendOutboundMessage)

    const handleInboundMessage: HandleInboundMessage = (rawData) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"host"> = (m) => {
            const {number, userId: guessId, body} = getParts<InboundFromHostMesMessage, "number" | "userId" | "body">(m, {number: 2, userId: 3, body: 4})
            const outboundToHostSackMessage = getMessage<OutboundToHostServerAckMessage>({prefix: "sack", number, userId: guessId})
            const outboundToGuessMesMessageKey = `guess:${guessId}:mes:${number}:${hostId}` as const
            const outboundToGuessMesMessageParts = {prefix: "mes" as const, number, userId: hostId, body}
            const outboundToGuessMesMessage = getMessage<InboundMessageTarget<InboundFromHostMesMessage>>(outboundToGuessMesMessageParts)
            const publishOutboundToGuessMesMessage = () => publishMessage<InboundMessageTarget<InboundFromHostMesMessage>>(guessId, outboundToGuessMesMessageParts)
            return [outboundToHostSackMessage, guessId, outboundToGuessMesMessageKey, outboundToGuessMesMessage, publishOutboundToGuessMesMessage]
        }
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

        applyHandleInboundMessage(rawData, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, hostId)
    }
    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE HOST FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        removeConnectedHost(hostId).catch(getHandleError(removeConnectedHost))
        unsubscribe().catch(getHandleError(unsubscribe))
        publishMessage<OutboundToGuessDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: hostId, body: hostName}).catch(getHandleError(publishMessage, "publish disconnection"))

        log(`disconnected, reason code:${reasonCode}, description: ${description}`)
    }

    setConnectionHandlers(handleInboundMessage, handleDisconnection)

    return Promise.all([
        subscribe(),
        // send outbound message for each connected guess
        getConnectedGuesses(hostId).then(guessesIds => !isEmpty(guessesIds) ? sendOutboundMessage(true, getMessage<OutboundToHostGuessesMessage>({prefix: "usrs", number: connectionDate, body: getUsersMessageBody(Object.entries(guessesIds).map(([id, date]) => [+id, "guess" + id, true, date]))})) : Promise.resolve()),
        //getConnectedGuesses(hostId).then(guessesIds => sendOutboundMessage(true, ...guessesIds.map(([guessId, date]) => getMessage<OutboundToHostConMessage>({prefix: "con", number: date, userId: guessId})))),
        ...Object.values(getHostCachedMessages(hostId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
        // publish host connection, maybe do it after the other promises succeed
        publishMessage<OutboundToGuessConMessage>(undefined,{prefix: "con", number: connectionDate, userId: hostId, body: hostName})])
        .catch(r => panic("initializing: " + (r as string)))
        .then()
}
