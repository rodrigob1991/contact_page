import {UserType} from "chat-common/src/model/types"
import {AcceptConnection, ApplyHandleInboundMessage, CacheAndSendUntilAck} from "../app"
import {PublishMessage, RemoveMessage, SubscribeToMessages} from "../redis"

type NewUser<UT extends UserType> = () => Promise<UT extends "host" ? boolean : number>
type RemoveUser<UT extends UserType> = UT extends "host" ? () => Promise<boolean> : (guessId: number) => Promise<boolean>
type GetUsers<UT extends UserType> = () => Promise<UT extends "host" ? number[] : boolean>

export type InitUserConnection<UT extends UserType> = (acceptConnection : AcceptConnection, newUser: NewUser<UT>, removeUser: RemoveUser<UT>, getUsers: GetUsers<UT>, publishMessage: PublishMessage, subscribeToMessages : SubscribeToMessages, removeMessage: RemoveMessage, cacheAndSendUntilAck: CacheAndSendUntilAck,applyHandleInboundMessage: ApplyHandleInboundMessage) => void