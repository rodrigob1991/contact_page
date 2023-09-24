import {
    GetMessages,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage,
    InboundMessageTarget,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessHostsMessage,
    OutboundToGuessServerAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage,
    OutboundToHostUserAckMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getParts, getPrefix, getUsersMessageBody} from "chat-common/src/message/functions"
import {InitUserConnection} from "../types"
import {RedisMessageKey, UnsubscribeToMessages} from "../../redis"
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
    SendMessage
} from "../../app"
import {getHosts} from "../host/authentication"

export const initConnection : InitUserConnection<"guess"> = async (guessData, acceptConnection, closeConnection, addConnectedGuess, removeConnectedGuess, getConnectedHosts, publishMessage, handleGuessSubscriptionToMessages, getGuessCachedMessages, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const log = (msg: string) => { appLog(msg, "guess", guessId) }
    const getHandleError = (originFunction: (...args: any[]) => any, reason2?: string, callback?: (r: string) => void) => appGetHandleError(originFunction, reason2, "guess", guessId, callback)

    const sendOutboundMessage: SendMessage<"guess"> = async (cache, ...messages) => {
        const promises: Promise<void>[] = []
        for (const message of messages) {
            const keyPrefix = `guess:${guessId}:` as const
            let key: RedisMessageKey<GetMessages<"guess", "out">>
            const mp = getPrefix(message)
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
        return Promise.all(promises).then()
    }

    const handleInboundMessage: HandleInboundMessage = (m) => {
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

        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckConMessage, handleInboundAckDisMessage, handleInboundAckUsrsMessage, handleInboundAckUackMessage, handleInboundAckMesMessage, guessId)
    }

    const handleDisconnection: HandleDisconnection = (reasonCode, description) => {
        // CONSIDER IF REMOVE GUESS FAIL AND THE ID CONTINUE STORED
        // AND IF UNSUBSCRIBE FAIL AND THE CONSUMER REMAIN ON
        removeConnectedGuess(guessId).catch(getHandleError(removeConnectedGuess))
        unsubscribe().catch(getHandleError(unsubscribe))
        publishMessage<OutboundToHostDisMessage>(undefined,{prefix: "dis", number: Date.now(), userId: guessId}).catch(getHandleError(publishMessage, "publish disconnection"))

        log(`disconnected, reason code:${reasonCode}, description: ${description}`)
    }

    let subscribe
    let unsubscribe: UnsubscribeToMessages = () => Promise.resolve()

    let guessId = -1
    let connectionDate = -1
    let connectionAccepted = false
    try {
        ({id: guessId, date: connectionDate} = await addConnectedGuess(guessData.id))
        acceptConnection(true, handleInboundMessage, handleDisconnection,  undefined, guessId)
        connectionAccepted = true
    } catch (e) {
        acceptConnection(false, undefined, undefined,"error initializing guess : " + JSON.stringify(e), guessId)
    }
    if (connectionAccepted)
        try {
            [subscribe, unsubscribe] = handleGuessSubscriptionToMessages(guessId, sendOutboundMessage)
            await Promise.all([
                subscribe(),
                // send outbound message if host is connected
                Promise.all([getHosts(), getConnectedHosts(guessId)]).then(([hosts, connectedHosts]) => sendOutboundMessage(true, getMessage<OutboundToGuessHostsMessage>({
                    prefix: "usrs",
                    number: connectionDate,
                    body: getUsersMessageBody(Object.entries(hosts).map(([id, {name}]) => {
                        const isConnected = id in connectedHosts
                        return [+id, name, isConnected, isConnected ? connectedHosts[+id] : undefined]
                    }))
                }))),
                ...Object.values(getGuessCachedMessages(guessId, {mes: true, uack: true})).map(promise => promise.then(messages => sendOutboundMessage(false, ...messages))),
                // publish guess connection
                publishMessage<OutboundToHostConMessage>(undefined,{prefix: "con", number: connectionDate,userId: guessId})])
        } catch (e) {
            closeConnection("error initializing guess : " + JSON.stringify(e))
        }
}