import {
    GetMessages,
    InboundAckMessageOrigin,
    InboundFromGuessAckMessage,
    InboundFromGuessMesMessage,
    InboundMessageTarget,
    OutboundMessage,
    OutboundMessageTemplate,
    OutboundToGuessConMessage,
    OutboundToHostAckMessage,
    OutboundToHostConMessage,
    OutboundToHostDisMessage
} from "chat-common/src/message/types"
import {getCutMessage, getMessage, getMessageParts, getMessagePrefix} from "chat-common/src/message/functions"
import ws from "websocket"
import {messagePrefixes} from "chat-common/src/model/constants"
import {HandleUserDisconnection, InitUserConnection} from "./types"
import {RedisMessageKey, Unsubscribe} from "../redis"
import {HandleInboundAckMessage, HandleInboundMesMessage} from "../app"

export const initGuessConnection : InitUserConnection<"guess"> = async (acceptConnection, newGuess, removeGuess, getHost, publishMessage, subscribeToMessages, removeMessage, cacheAndSendUntilAck, applyHandleInboundMessage) => {
    const sendOutboundMessage = (...messages: OutboundMessageTemplate<"guess">[]) => {
        for (const message of messages) {
            let key: RedisMessageKey<GetMessages<"guess", "out">>
            const mp = getMessagePrefix(message)
            switch (mp) {
                case "con":
                case "dis":
                case "ack":
                    key = `guess:${guessId}:${message as OutboundMessageTemplate<"guess", "con" | "dis" | "ack">}`
                    break
                case "mes":
                    key = `guess:${guessId}:${getCutMessage<OutboundMessage<"guess", "mes">, "body">(message as OutboundMessageTemplate<"guess", "mes">, {body: 3}, 3)}`
                    break
                default:
                    throw new Error("invalid message prefix")
            }
            cacheAndSendUntilAck(key, message)
        }
    }

    const handleInboundMessage = (m: ws.Message) => {
        const handleInboundMesMessage: HandleInboundMesMessage<"guess"> = (m) => {
            const {number, body} = getMessageParts<InboundFromGuessMesMessage, "number" | "body">(m, {number: 2, body: 3})
            publishMessage<InboundMessageTarget<InboundFromGuessMesMessage>>({prefix: "mes", number: number, guessId: guessId, body: body}, "host", undefined)
        }
        const handleInboundAckMessage: HandleInboundAckMessage<"guess"> = (a) => {
            const {originPrefix, number} = getMessageParts<InboundFromGuessAckMessage, "originPrefix" | "number">(a, {originPrefix: 2, number: 3})
            removeMessage<InboundAckMessageOrigin<"guess">>(`guess:${guessId}:${originPrefix}:${number}`)
            if (originPrefix === messagePrefixes.mes)
                publishMessage<OutboundToHostAckMessage>({prefix: "ack", number: number, guessId: guessId}, "host", undefined)
        }
        applyHandleInboundMessage(m, handleInboundMesMessage, handleInboundAckMessage)
    }

    let unsubscribe : Unsubscribe | undefined
    const handleDisconnection: HandleUserDisconnection = (reasonCode, description) => {
        console.log(`guess ${guessId} disconnected, reason code:${reasonCode}, description: ${description}`)
        publishMessage<OutboundToHostDisMessage>({prefix: "dis", number: Date.now(), guessId: guessId}, "host", undefined)
        removeGuess(guessId)
        if (unsubscribe)
            unsubscribe()
    }

    const guessId = await newGuess()

    const [connection, connectionDate] = acceptConnection(true)
    connection.on("message", handleInboundMessage)
    connection.on("close", handleDisconnection)

    subscribeToMessages(sendOutboundMessage, "guess", guessId).then(u => { unsubscribe = u })
    publishMessage<OutboundToHostConMessage>({number: Date.now(), prefix: "con", guessId: guessId}, "host", undefined)
    // send outbound con message if host connected
    getHost().then(isHost => { if (isHost) sendOutboundMessage(getMessage<OutboundToGuessConMessage>({prefix: "con", number: connectionDate})) })
}