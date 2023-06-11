import {MessagePrefix, TheOtherUserType, UserType} from "chat-common/src/model/types"
import {AcceptConnection, CloseConnection, HandleInboundAckMessage, HandleInboundMesMessage, SendMessage} from "../app"
import {
    AddConnectedUserResult,
    GetCachedMessagesResult,
    GetConnectedUsersResult,
    HandleUserSubscriptionToMessagesReturn,
    RedisMessageKey,
    UserIdToPublish,
    WhatPrefixes,
} from "../redis"
import {GotAllMessageParts, OutboundMessage} from "chat-common/src/message/types"
import ws from "websocket"

type AddConnectedUser = () => AddConnectedUserResult
type RemoveConnectedUser = (userId: number) => Promise<void>
type GetConnectedUsers = (toUserId: number) => GetConnectedUsersResult
type HandleUserSubscriptionToMessages<UT extends UserType> = (ofUserId: number, sm: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn
type PublishUserMessage<UT extends UserType> = <M extends OutboundMessage<TheOtherUserType<UT>>, MP extends M["prefix"] =M["prefix"]>(toUserId: UserIdToPublish<MP>, mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMessages<UT extends UserType> = <WP extends WhatPrefixes>(ui: number, wp: WP) => GetCachedMessagesResult<UT, WP>
type CacheAndSendUntilAck<UT extends UserType> = <M extends OutboundMessage<UT>[]>(cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey<M>, message: M[number]["template"], userId: number) => Promise<void>
export type ApplyHandleInboundMessage<UT extends UserType> = UT extends "host" ? (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"host">, handleAckMessage: HandleInboundAckMessage<"host">) => void : (wsMessage: ws.Message, handleMesMessage: HandleInboundMesMessage<"guess">, handleAckMessage: HandleInboundAckMessage<"guess">, guessId: number) => void

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, closeConnection: CloseConnection, addConnectedUser: AddConnectedUser, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers, publishUserMessage: PublishUserMessage<UT>, handleUserSubscriptionToMessages : HandleUserSubscriptionToMessages<UT>, getUserCachedMesMessages: GetUserCachedMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck<UT>,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => void