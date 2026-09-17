import {ConnectedUserData, MessagePrefix, OppositeUserType, UserType} from "chat-common/src/model/types"
import {ApplyHandleInboundMessage, SendMessage, SetConnectionHandlers} from "../app"
import {
    AddConnectedUserResult,
    GetCachedMessagesResult,
    GetConnectedUsersResult,
    HandleUserSubscriptionToMessagesReturn,
    PublishMessagePrefix,
    RedisMessageKey,
    UserIdToPublish,
    WhatPrefixes,
} from "../redis"
import {GotAllMessageParts, OutboundMessage} from "chat-common/src/message/types"
import {RequestCookies} from "utils/src/http/request/headers/cookies"
import {ResponseCookies} from "utils/src/http/response/headers/cookies"

type AddConnectedUser<UT extends UserType> = (userId: number | ("guess" extends UT ? undefined : never)) => AddConnectedUserResult

export type AttemptConnection<UT extends UserType> = (cookies: RequestCookies, addConnectedUser: AddConnectedUser<UT>) => Promise<ConnectedUserData<UT>>

type RemoveConnectedUser = (userId: number) => Promise<void>
type GetConnectedUsers = (toUserId: number) => GetConnectedUsersResult
type HandleUserSubscriptionToMessages<UT extends UserType> = (ofUserId: number, sm: SendMessage<UT>) => HandleUserSubscriptionToMessagesReturn
type PublishUserMessage<UT extends UserType> = <M extends OutboundMessage<OppositeUserType[UT], PublishMessagePrefix>, MP extends M["prefix"] =M["prefix"]>(toUserId: UserIdToPublish<MP>, mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMessages<UT extends UserType> = <WP extends WhatPrefixes>(ui: number, wp: WP) => GetCachedMessagesResult<UT, WP>
type CacheAndSendUntilAck<UT extends UserType> = <M extends OutboundMessage<UT>[]>(cache: boolean, messagePrefix: MessagePrefix<"out">, key: RedisMessageKey<M>, message: M[number]["template"], userId: number) => Promise<void>

export type InitUserConnection<UT extends UserType> = (userData: ConnectedUserData<UT>, setConnectionHandlers : SetConnectionHandlers, removeConnectedUser: RemoveConnectedUser, getConnectedUsers: GetConnectedUsers, publishUserMessage: PublishUserMessage<UT>, handleUserSubscriptionToMessages : HandleUserSubscriptionToMessages<UT>, getUserCachedMesMessages: GetUserCachedMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck<UT>,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => Promise<void>
//export type ExtractUserData<UT extends UserType> = (cookies: Cookies) => Promise<User<UT>["data"]>
export type GetResponseCookies = (userId: number) => ResponseCookies