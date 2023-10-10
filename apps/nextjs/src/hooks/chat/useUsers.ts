import {AccountedUserData, UserType} from "chat-common/src/model/types"
import {useEffect, useRef, useState} from "react"
import {getRandomColor} from "utils/src/random"

export type User = AccountedUserData & { selected: boolean, color: string }
export type SetUsers = (...targetUsers: AccountedUserData[]) => void
export type SetConnectedUser = (id: number, name: string, date: number) => void
export type SetDisconnectedUser = (id: number, name: string, date: number) => void
export type SetDisconnectedAllUsers = () => void
export type SelectOrUnselectUser = (index: number) => void
export type GetUserColor = (id: number) => string

export const LOCAL_USER_ID = -1
export const LOCAL_USER_NAME = "me"

export const useUsers = (userType: UserType) : [User[], SetUsers, GetUserColor, SetConnectedUser, SetDisconnectedUser, SetDisconnectedAllUsers, SelectOrUnselectUser]=> {
    const [users, setUsers] = useState<User[]>([])

    const userColorMapRef = useRef(new Map<number, string>([[LOCAL_USER_ID, "black"]]))
    const getUserColorMap = () => userColorMapRef.current
    const getUserColor: GetUserColor = (id) => {
        let color = getUserColorMap().get(id)
        if (!color) {
            color = getRandomColor()
            getUserColorMap().set(id, color)
        }
        return color
    }

    useStorage(userType, users, setUsers, (id, color) => {
        getUserColorMap().set(id, color)
    })

    const setUsersConnections = (...targetUsers: AccountedUserData[]) => {
        const connectedUsersNames: string[] = []
        const disconnectedUsersNames: string[] = []
        setUsers((users) => {
            const updatedUsers = [...users]
            for (const {id, name, isConnected, date} of targetUsers) {
                const user = updatedUsers.find(u => u.id === id)
                if (user) {
                    if (date && (date > (user.date ?? 0))) {
                        user.date = date
                        if (isConnected) {
                            user.isConnected = true
                            connectedUsersNames.push(name)
                        } else {
                            user.isConnected = false
                            disconnectedUsersNames.push(name)
                        }
                    }
                } else {
                    updatedUsers.push({id, name, isConnected, date, selected: false, color: getUserColor(id)})
                    if (isConnected) {
                        connectedUsersNames.push(name)
                    }
                }
            }
            return updatedUsers
        })
        if (connectedUsersNames.length > 0) {
            //handleUsersConnection(connectedUsersNames)
        }
        if (disconnectedUsersNames.length > 0) {
            //handleUsersDisconnection(connectedUsersNames)
        }
    }
    const setConnectedUser = (id: number, name: string, date: number) => {
        setUsersConnections({id, name, isConnected: true, date})
    }
    const setDisconnectedUser = (id: number, name: string, date: number) => {
        setUsersConnections({id, name, isConnected: false, date})
    }
    const setDisconnectedAllUsers = () => {
        setUsers((users) => {
            const updatedUsers = [...users]
            updatedUsers.forEach(u => u.isConnected = false)
            return updatedUsers
        })
    }
    const selectOrUnselectUser: SelectOrUnselectUser = (index) => {
        setUsers((users) => {
            const updatedUsers = [...users]
            const user = updatedUsers[index]
            user.selected = !user.selected

            return updatedUsers
        })
    }

    return [users, setUsersConnections, getUserColor, setConnectedUser, setDisconnectedUser, setDisconnectedAllUsers, selectOrUnselectUser]
}

type UsersInLocalStorage = Pick<User, "id" | "name" | "color">[]
const useStorage = (userType: UserType, users: User[], setUsers: (users: User[]) => void, setUserColor: (id: number, color: string) => void) => {
    const localStorageKey = "users:" + userType
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const usersStr = JSON.stringify(users.map(({id, name, color}) => ({
            id, name, color
        })))
        localStorage.setItem(localStorageKey, usersStr)
    }
    useEffect(() => {
        const usersJson = localStorage.getItem(localStorageKey)
        if (usersJson) {
            const users: User[] = [];
            (JSON.parse(usersJson) as UsersInLocalStorage)
                .forEach(({id, name, color}) => {
                    users.push({id, name, color, isConnected: false, selected: false})
                    setUserColor(id, color)
                })
            setUsers(users)
        }

    }, [])
    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [users])
}