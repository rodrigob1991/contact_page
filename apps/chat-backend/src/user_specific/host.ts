import {RedisMessageKey, Unsubscribe} from "../redis"
import {
    GetMessages,
    InboundAckMessageOrigin,
    InboundFromHostAckMessage,
    InboundFromHostMesMessage,
    InboundMessageTarget,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessAckMessage,
    OutboundToGuessConMessage,
    OutboundToGuessDisMessage,
    OutboundToHostConMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"
import ws from "websocket"
import {messagePrefixes} from "chat-common/src/model/constants"
import {HandleInboundAckMessage, HandleInboundMesMessage} from "../app"
import {HandleUserDisconnection, InitUserConnection} from "./types"

export const initHostConnection : InitUserConnection<"host">  = async (acceptConnection, newHost, removeHost, getGuesses, publishMessage, subscribeToMessages, removeMessage, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage = (...messages: OutboundMessageTemplate<"host">[]) => {
        for (const message of messages) {
            let key: RedisMessageKey<GetMessages<"host", "out">>
            const mp = getMessagePrefix(message)
            switch (mp) {
                case "con":
                case "dis":
                case "ack":
                    key = `host:${message as OutboundMessageTemplate<"host", "con" | "dis" | "ack">}`
                    break
                case "mes":
                    key = `host:${getCutMessage<OutboundMessage<"host", "mes">, "body">(message as OutboundMessageTemplate<"host", "mes">, {body: 4}, 4)}`
                    break
                default:
                    throw new Error("invalid message prefix")
            }
            cacheAndSendUntilAck(key, message)
        }
    }

    const handleInboundMessage = (m: ws.Message) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"host"> = (m) => {
            const {number, guessId: toGuessId, body} = getMessageParts<InboundFromHostMesMessage, "number" | "guessId" | "body">(m, {number: 2, guessId: 3, body: 4})
            publishMessage<InboundMessageTarget<InboundFromHostMesMessage>>({prefix: "mes", number: number, body: body}, "guess", toGuessId)
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"host"> = (a) => {
            const {originPrefix, number, guessId: fromGuessId} = getMessageParts<InboundFromHostAckMessage, "number" | "guessId" | "originPrefix">(a, {originPrefix: 2, number: 3, guessId: 4})
            if (originPrefix === messagePrefixes.mes) {
                publishMessage<OutboundToGuessAckMessage>({prefix: "ack", number: number}, "guess", fromGuessId)
            }
            removeMessage<InboundAckMessageOrigin<"host">>(`host:${originPrefix}:${number}:${fromGuessId}`)
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage)
    }

    let unsubscribe : Unsubscribe | undefined
    const handleDisconnection: HandleUserDisconnection = (reasonCode, description) => {
        console.log(`host disconnected, reason code:${reasonCode}, description: ${description}`)
        publishMessage<OutboundToGuessDisMessage>({prefix: "dis", number: Date.now()}, "guess", undefined)
        removeHost()
        if (unsubscribe)
            unsubscribe()
    }

    const added = await newHost()
    if (added) {
        const [connection, connectionDate] = acceptConnection(true)
        connection.on("message", handleInboundMessage)
        connection.on("close", handleDisconnection)

        subscribeToMessages(sendOutboundMessage, "host", undefined).then(u => { unsubscribe = u })
        publishMessage<OutboundToGuessConMessage>({number: Date.now(), prefix: "con"}, "guess", undefined)
        // send outbound con message for each connected guess
        getGuesses().then(guessesIds => sendOutboundMessage(...guessesIds.map(guessId => getMessage<OutboundToHostConMessage>({prefix: "con", number: connectionDate, guessId: guessId}))))
    } else {
        acceptConnection(false)
    }
}
