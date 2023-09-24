import {MessagePrefix, TheOtherUserType, User, UserType} from "chat-common/src/model/types"
import {AcceptConnection, ApplyHandleInboundMessage, CloseConnection, SendMessage} from "../app"
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

type AddConnectedUser<UT extends UserType> = (userId: number | ("guess" extends UT ? undefined : never)) => AddConnectedUserResult
type RemoveConnectedUser = (userId: number) => Promise<void>
type GetConnectedUsers = (toUserId: number) => GetConnectedUsersResult
type HandleUserSubscriptionToMessages<UT extends UserType> = (ofUserId: number, sm: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn
type PublishUserMessage<UT extends UserType> = <M extends OutboundMessage<TheOtherUserType<UT>>, MP extends M["prefix"] =M["prefix"]>(toUserId: UserIdToPublish<MP>, mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMessages<UT extends UserType> = <WP extends WhatPrefixes>(ui: number, wp: WP) => GetCachedMessagesResult<UT, WP>
type CacheAndSendUntilAck<UT extends UserType> = <M extends OutboundMessage<UT>[]>(cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey<M>, message: M[number]["template"], userId: number) => Promise<void>

export type InitUserConnection<UT extends UserType> = (userData: User<UT>["data"], acceptConnection : AcceptConnection, closeConnection: CloseConnection, addConnectedUser: AddConnectedUser<UT>, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers, publishUserMessage: PublishUserMessage<UT>, handleUserSubscriptionToMessages : HandleUserSubscriptionToMessages<UT>, getUserCachedMesMessages: GetUserCachedMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck<UT>,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => Promise<void>