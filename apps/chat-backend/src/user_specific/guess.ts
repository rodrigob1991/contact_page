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
import {getCutMessage, getMessage, getMessageParts} from "chat-common/src/message/functions";
import ws from "websocket"
import {messagePrefixes, users} from "chat-common/src/model/constants"

export const initGuessConnection = (getGuessId) => {
    const guessId = await newUser("guess")
    connection = acceptConnection()

    const sendMessage: SendMessage<"guess"> = (...messages) => {
        for (const message of messages) {
            let key: RedisMessageKey<GetMessages<"guess", "out">>
            const mp = getMessageParts<OutboundMessage<"guess">, "prefix">(message, {prefix: 1}).prefix
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
            sendMessage(key, message)
        }
    }

    const handleMessageFromGuess = (m: ws.Message) => {
        const handleMesMessage: HandleMesMessage<"guess"> = (m) => {
            const {number, body} = getMessageParts<InboundFromGuessMesMessage, "number" | "body">(m, {number: 2, body: 3})
            publishMessage<InboundMessageTarget<InboundFromGuessMesMessage>>({prefix: "mes", number: number, guessId: guessId, body: body}, "host", undefined)
        }
        const handleAckMessage: HandleAckMessage<"guess"> = (a) => {
            const {originPrefix, number} = getMessageParts<InboundFromGuessAckMessage, "originPrefix" | "number">(a, {originPrefix: 2, number: 3})
            removeMessage<InboundAckMessageOrigin<"guess">>(`guess:${guessId}:${originPrefix}:${number}`)
            if (originPrefix === messagePrefixes.mes)
                publishMessage<OutboundToHostAckMessage>({prefix: "ack", number: number, guessId: guessId}, "host", undefined)
        }
        handleMessage(m, handleMesMessage, handleAckMessage)
    }

    const handleGuessDisconnection = (reasonCode: number, description: string) => {
        console.log(`guess ${guessId} disconnected, reason code:${reasonCode}, description: ${description}`)
        publishMessage<OutboundToHostDisMessage>({prefix: "dis", number: Date.now(), guessId: guessId}, "host", undefined)
        removeUser(guessId)
    }

    subscribeToMessages(sendMessageToGuess, "guess", guessId)
    publishMessage<OutboundToHostConMessage>({number: Date.now(), prefix:"con", guessId: guessId}, "host", undefined)
    connection.on("message", handleMessageFromGuess)
    connection.on("close", handleGuessDisconnection)
    getUsers(users.host).then(hostId => { if(hostId.length > 0) sendMessageToGuess(getMessage<OutboundToGuessConMessage>({prefix: "con", number: connectionDate})) })
}
}