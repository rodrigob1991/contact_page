import {UserType} from "chat-common/src/model/types"
import {AcceptConnection, ApplyHandleInboundMessage, CacheAndSendUntilAck} from "../app"
import {PublishMessage, RemoveMessage, SubscribeToMessages} from "../redis"

type NewUser<UT extends UserType> = () => Promise<UT extends "host" ? void : number>
type RemoveUser<UT extends UserType> = UT extends "host" ? () => Promise<void> : (guessId: number) => Promise<void>
type GetUsers<UT extends UserType> = () => Promise<UT extends "host" ? number[] : boolean>

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, newUser: NewUser<UT>, removeUser: RemoveUser<UT>, getUsers: GetUsers<UT>, publishMessage: PublishMessage, subscribeToMessages : SubscribeToMessages, removeMessage: RemoveMessage, cacheAndSendUntilAck: CacheAndSendUntilAck,applyHandleInboundMessage: ApplyHandleInboundMessage) => void