import {
    GetMessages,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage,
    InboundMessageTarget,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToGuessHostsMessage,
    OutboundToGuessMesMessage,
    OutboundToGuessServerAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostUserAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getParts, getPrefix, getUsersMessageBody} from "chat-common/src/message/functions"
import {InitUserConnection} from "../types"
import {RedisMessageKey} from "../../redis"
import {
    getHandleError,
    HandleDisconnection,
    HandleInboundAckConMessage,
    HandleInboundAckDisMessage,
    HandleInboundAckMesMessage,
    HandleInboundAckUackMessage,
    HandleInboundAckUsrsMessage,
    HandleInboundMesMessage,
    HandleInboundMessage,
    SendMessage
} from "../../app"
import {log as appLog} from "../../logs"
import {getHosts} from "../host/authentication"
import {isEmpty} from "utils/src/objects"

export const initConnection : InitUserConnection<"guess"> = async ({id: guessId, name: guessName, date: connectionDate}, setConnectionHandlers, removeConnectedGuess, getConnectedHosts, publishMessage, handleGuessSubscriptionToMessages, getGuessCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const log = (msg: string) => { appLog(msg, "guess", guessId) }

    const sendOutboundMessage: SendMessage<"guess"> = async (cache, ...messages) =>
        Promise.all(messages.map(message => {
            const keyPrefix = `guess:${guessId}:` as const
            let key: RedisMessageKey<GetMessages<"guess", "out">> | undefined = undefined
            const mp = getPrefix(message)
            switch (mp) {
                case "usrs":
                    key = `${keyPrefix}${getCutMessage<OutboundToGuessHostsMessage, "body">(message as OutboundToGuessHostsMessage["template"], {body: 3}, 3)}`
                    break
                case "con":
                    key = `${keyPrefix}${getCutMessage<OutboundToGuessConMessage, "body">(message as OutboundToGuessConMessage["template"], {body: 4}, 4)}`
                    break
                case "dis":
                    key = `${keyPrefix}${getCutMessage<OutboundToGuessDisMessage, "body">(message as OutboundToGuessDisMessage["template"], {body: 4}, 4)}`
                    break
                case "uack":
                    key = `${keyPrefix}${message as OutboundMessageTemplate<"guess", "uack">}`
                    break
                case "mes":
                    key = `${keyPrefix}${getCutMessage<OutboundToGuessMesMessage, "body">(message as OutboundToGuessMesMessage["template"], {body: 4}, 4)}`
                    break
            }
            return cacheAndSendUntilAck<GetMessages<"guess", "out">>(cache, mp, key, message, guessId)
        })).then()

    const [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(guessId, sendOutboundMessage)

    const handleInboundMessage: HandleInboundMessage = (rawData) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"guess"> = (m) => {
            const {number, body, userId: hostId} = getParts<InboundFromGuessMesMessage, "number" | "userId" | "body">(m, {number: 2, userId: 3, body: 4})
            const outboundToGuessSackMessage = getMessage<OutboundToGuessServerAckMessage>({prefix: "sack", number, userId: hostId})
            const outboundToHostMesMessageParts = {prefix: "mes" as const, number, userId: guessId, body}
            const outboundToHostMesMessageKey = `host:${hostId}:mes:${number}:${guessId}` as const
            const outboundToHostMesMessage = getMessage<InboundMessageTarget<InboundFromGuessMesMessage>>(outboundToHostMesMessageParts)
            const publishOutboundToHostMesMessage = () => publishMessage<InboundMessageTarget<InboundFromGuessMesMessage>>(hostId, outboundToHostMesMessageParts)
            return [outboundToGuessSackMessage, hostId, outboundToHostMesMessageKey, outboundToHostMesMessage, publishOutboundToHostMesMessage]
        }

        const handleInboundAckConMessage: HandleInboundAckConMessage<"guess"> = (m) => {
            const {number, userId: hostId} = getParts<InboundFromGuessAckMessage<"con">, "number" | "userId">(m, {number: 3, userId: 4})
            return `guess:${guessId}:con:${number}:${hostId}`
        }
        const handleInboundAckDisMessage: HandleInboundAckDisMessage<"guess"> = (m) => {
            const {number, userId: hostId} = getParts<InboundFromGuessAckMessage<"dis">, "number" | "userId">(m, {number: 3, userId: 4})
            return `guess:${guessId}:dis:${number}:${hostId}`
        }
        const handleInboundAckUsrsMessage: HandleInboundAckUsrsMessage<"guess"> = (m) => {
            const {number} = getParts<InboundFromGuessAckMessage<"usrs">, "number">(m, {number: 3})
            return `guess:${guessId}:usrs:${number}`
        }
        const handleInboundAckUackMessage: HandleInboundAckUackMessage<"guess"> = (m) => {
            const {number, userId: hostId} = getParts<InboundFromGuessAckMessage<"uack">, "number" | "userId">(m, {number: 3, userId: 4})
            return `guess:${guessId}:uack:${number}:${hostId}`
        }
        const handleInboundAckMesMessage: HandleInboundAckMesMessage<"guess"> = (m) => {
            const {number, userId: hostId} = getParts<InboundFromGuessAckMessage<"mes">, "number" | "userId">(m, {number: 3, userId: 4})

            const originOutboundMessageKey = `guess:${guessId}:mes:${number}:${hostId}` as const

            const outboundToHostUackMessageParts = {prefix: "uack" as const, number, userId: guessId}
            const outboundToHostUackMessageKey = `host:${hostId}:uack:${number}:${guessId}` as const
            const outboundToHostUackMessage = getMessage<OutboundToHostUserAckMessage>(outboundToHostUackMessageParts)
            const publishOutboundToGuessUackMessage = () => publishMessage<OutboundToHostUserAckMessage>(hostId, outboundToHostUackMessageParts)

            return [originOutboundMessageKey, guessId, outboundToHostUackMessageKey, outboundToHostUackMessage, publishOutboundToGuessUackMessage]
        }

        applyHandleInboundMessage(rawData, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, guessId)
    }

    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE GUESS FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        removeConnectedGuess(guessId).catch(getHandleError(removeConnectedGuess))
        unsubscribe().catch(getHandleError(unsubscribe))
        publishMessage<OutboundToHostDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: guessId, body: guessName}).catch(getHandleError(publishMessage, "publish disconnection"))

        log(`disconnected, reason code:${reasonCode}, description: ${description}`)
    }

    setConnectionHandlers(handleInboundMessage, handleDisconnection)

    return Promise.all([
        subscribe(),
        // send outbound message if host is connected
        Promise.all([getHosts(), getConnectedHosts(guessId)]).then(([hosts, connectedHosts]) => !isEmpty(hosts) ? sendOutboundMessage(true, getMessage<OutboundToGuessHostsMessage>({
            prefix: "usrs",
            number: connectionDate,
            body: getUsersMessageBody(Object.entries(hosts).map(([id, {name}]) => {
                const isConnected = id in connectedHosts
                return [+id, name, isConnected, isConnected ? connectedHosts[+id] : undefined]
            }))
        })) : Promise.resolve()),
        ...Object.values(getGuessCachedMessages(guessId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
        // publish guess connection, maybe do it after the other promises succeed
        publishMessage<OutboundToHostConMessage>(undefined,{prefix: "con", number: connectionDate, userId: guessId, body: guessName})])
        .then()
}