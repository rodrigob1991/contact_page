import {isEmpty, recursiveSplit} from "utils/src/strings"
import {Host} from "chat-common/src/model/types"
import fs from "fs"
import path from "path"

// change this implementation for a decent authentication

type Hosts = { [id: number]: Host }

export const getHosts = () =>
    new Promise<Hosts>((resolve, reject) => {
        const hosts: Hosts = {}
        const filePath = path.join(__dirname, "hosts")
        fs.readFile(filePath, 'utf8', (error, hostsStr) => {
            if (error) {
                reject("error reading hosts file:" + error.message)
            } else {
                recursiveSplit(hostsStr, [",", ":"]).forEach(hostData => {
                    const id = hostData[0]
                    const name = hostData[1]
                    const password = hostData[2]
                    if (isEmpty(id) || isNaN(+id) || isEmpty(name) || isEmpty(password)) {
                        reject(`invalid host data, id: ${id}, name: ${name}, password: ${password}`)
                    }
                    hosts[+id] = {id: +id, name: name, password: password}
                })
            }
        })
        resolve(hosts)
    })

export const isHostValidRegistered = (id: number, password: string) =>
    getHosts().then(hosts => (id in hosts && hosts[id].password === password) ? hosts[id] : undefined
    )
