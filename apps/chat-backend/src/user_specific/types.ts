import {UserType} from "chat-common/src/model/types"
import {
    AcceptConnection,
    CloseConnection, HandleInboundAckMessage,
    HandleInboundMesMessage,
    SendMessage
} from "../app"
import {GuessIdToPublish, RedisMessageKey} from "../redis"
import {GotAllMessageParts, OutboundMessage} from "chat-common/src/message/types"
import ws from "websocket"

type NewUser<UT extends UserType> = () => Promise<UT extends "host" ? void : number>
type RemoveUser<UT extends UserType> = UT extends "host" ? () => Promise<boolean> : (guessId: number) => Promise<boolean>
type GetUsers<UT extends UserType> = UT extends "host" ? () => Promise<number[]> : (toGuessId: number) => Promise<boolean>
type SubscribeUserToMessages<UT extends UserType> = UT extends "host" ? (sm: SendMessage<UT>) => Promise<void> : (sm: SendMessage<UT>, gi: number) => Promise<void>
type PublishUserMessage<UT extends UserType> = UT extends "host" ? <M extends OutboundMessage<"guess">, MP extends M["prefix"] =M["prefix"]>(mp: GotAllMessageParts<M>, toGuessId: GuessIdToPublish<M["userType"], MP>) => Promise<void> : <M extends OutboundMessage<"host">>(mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMesMessages<UT extends UserType> = UT extends "host" ? () => Promise<OutboundMessage<"host">["template"][]> : (gi: number) => Promise<OutboundMessage<"guess">["template"][]>
type CacheAndSendUntilAck<UT extends UserType> = UT extends "host" ?  <M extends OutboundMessage<"host">[]> (key: RedisMessageKey<M>, message: M[number]["template"]) => Promise<void> : <M extends OutboundMessage<"guess">[]>(key: RedisMessageKey<M>, message: M[number]["template"], guessId: number) => Promise<void>
export type ApplyHandleInboundMessage<UT extends UserType> = UT extends "host" ? (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"host">, handleAckMessage: HandleInboundAckMessage<"host">) => void : (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"guess">, handleAckMessage: HandleInboundAckMessage<"guess">, guessId: number) => void

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, closeConnection: CloseConnection, newUser: NewUser<UT>, removeUser: RemoveUser<UT>, getUsers: GetUsers<UT>, publishUserMessage: PublishUserMessage<UT>, subscribeUserToMessages : SubscribeUserToMessages<UT>, getUserCachedMesMessages: GetUserCachedMesMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck<UT>,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => void