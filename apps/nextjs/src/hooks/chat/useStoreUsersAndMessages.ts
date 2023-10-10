import {useEffect} from "react"
import {InboundMessageData, OutboundMessageData, User, UserAckState} from "../../components/chat/Chat"

export const useStoreUsersAndMessages = () => {
    const usersLocalStorageKey = "users:" + userType

    type MessagesInLocalStorage = (InboundMessageData | ChangePropertyType<OutboundMessageData, ["toUsersIds", [number, UserAckState][]]>)[]
    const messagesLocalStorageKey = "messagesData:" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        localStorage.setItem(usersLocalStorageKey, JSON.stringify(users.map(({id, name, color}) => ({id, name, color}))))
        localStorage.setItem(messagesLocalStorageKey, JSON.stringify(messagesData.map(md => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: Array.from(toUsersIds.entries())}))(md))))
    }
    useEffect(() => {
        const usersJson = localStorage.getItem(usersLocalStorageKey)
        if (usersJson) {
            const users: User[] = [];
            (JSON.parse(usersJson) as UsersInLocalStorage)
                .forEach(({id, name, color}) => {
                    users.push({id, name, color, isConnected: false, selected: false})
                    getUserColorMap().set(id, color)
                })
            setUsers(users)
        }

        const messagesJson = localStorage.getItem(messagesLocalStorageKey)
        if (messagesJson)
            setMessagesData((JSON.parse(messagesJson) as MessagesInLocalStorage).map((md) => md.flow === "in" ? md : (({toUsersIds, ...rest})=> ({...rest, toUsersIds: new Map(toUsersIds)}))(md)))
    }, [])
    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [users, messagesData])
}