import {UserType} from "chat-common/src/model/types"
import {AcceptConnection, ApplyHandleInboundMessage, CacheAndSendUntilAck, SendMessage} from "../app"
import {GuessIdToPublish, RemoveMessage} from "../redis"
import {GotAllMessageParts, OutboundMessage} from "chat-common/src/message/types"

type NewUser<UT extends UserType> = () => Promise<UT extends "host" ? boolean : number>
type RemoveUser<UT extends UserType> = UT extends "host" ? () => Promise<boolean> : (guessId: number) => Promise<boolean>
type GetUsers<UT extends UserType> = () => Promise<UT extends "host" ? number[] : boolean>
type SubscribeUserToMessages<UT extends UserType> = UT extends "host" ? (sm: SendMessage<UT>) => Promise<void> : (sm: SendMessage<UT>, gi: number) => Promise<void>
type PublishUserMessage<UT extends UserType> = UT extends "host" ? <M extends OutboundMessage<"guess">, MP extends M["prefix"] =M["prefix"]>(mp: GotAllMessageParts<M>, toGuessId: GuessIdToPublish<M["userType"], MP>) => Promise<void> : <M extends OutboundMessage<"host">>(mp: GotAllMessageParts<M>) => Promise<void>
type GetUserCachedMesMessages<UT extends UserType> = UT extends "host" ? () => Promise<OutboundMessage<"host">["template"][]> : (gi: number) => Promise<OutboundMessage<"guess">["template"][]>

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, newUser: NewUser<UT>, removeUser: RemoveUser<UT>, getUsers: GetUsers<UT>, publishUserMessage: PublishUserMessage<UT>, subscribeUserToMessages : SubscribeUserToMessages<UT>, getUserCachedMesMessages: GetUserCachedMesMessages<UT>, cacheAndSendUntilAck: CacheAndSendUntilAck,applyHandleInboundMessage: ApplyHandleInboundMessage<UT>) => void