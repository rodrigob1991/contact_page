import {TheOtherUserType, UserType} from "chat-common/src/model/types"
import {AcceptConnection, CloseConnection, HandleInboundAckMessage, HandleInboundMesMessage, SendMessage} from "../app"
import {
    AddConnectedUserResult, GetConnectedUsersResult,
    HandleUserSubscriptionToMessagesReturn,
    RedisMessageKey, UserIdToPublish,
} from "../redis"
import {GotAllMessageParts, OutboundMessage} from "chat-common/src/message/types"
import ws from "websocket"

type AddConnectedUser = () => AddConnectedUserResult
type RemoveConnectedUser = (userId: number) => Promise<void>
type GetConnectedUsers = (toUserId: number) => GetConnectedUsersResult
type HandleUserSubscriptionToMessages<UT extends UserType> = UT extends "host" ? (sm: SendMessage<"host">) => HandleUserSubscriptionToMessagesReturn : (gi: number, sm: SendMessage<"guess">) => HandleUserSubscriptionToMessagesReturn
type PublishUserMessage<UT extends UserType> = <M extends OutboundMessage<TheOtherUserType<UT>>, MP extends M["prefix"] =M["prefix"]>(toUserId: UserIdToPublish<MP>, mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMesMessages<UT extends UserType> = UT extends "host" ? () => Promise<OutboundMessage<"host">["template"][]> : (gi: number) => Promise<OutboundMessage<"guess">["template"][]>
type CacheAndSendUntilAck<UT extends UserType> = UT extends "host" ?  <M extends OutboundMessage<"host">[]> (cache: boolean, key: RedisMessageKey<M>, message: M[number]["template"], hostId: number) => Promise<void> : <M extends OutboundMessage<"guess">[]>(cache: boolean, key: RedisMessageKey<M>, message: M[number]["template"], guessId: number) => Promise<void>
export type ApplyHandleInboundMessage<UT extends UserType> = UT extends "host" ? (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"host">, handleAckMessage: HandleInboundAckMessage<"host">) => void : (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"guess">, handleAckMessage: HandleInboundAckMessage<"guess">, guessId: number) => void

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, closeConnection: CloseConnection, addConnectedUser: AddConnectedUser, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers, publishUserMessage: PublishUserMessage<UT>, handleUserSubscriptionToMessages : HandleUserSubscriptionToMessages<UT>, getUserCachedMesMessages: GetUserCachedMesMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck<UT>,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => void