import {isEmpty} from "utils/src/strings"
import {getSplitFileContent} from "utils/src/files"
import {Host} from "chat-common/src/model/types"
import {panic} from "../../app"

// change this implementation for a decent authentication

type Hosts = { [id: number]: Host }

export const getHosts = () =>
    getSplitFileContent("hosts", [",", ":"]).then(hostsData => {
        const hosts: Hosts = {}
        hostsData.forEach(hostData => {
            const id = hostData[0]
            const name = hostData[1]
            const password = hostData[2]
            if (isEmpty(id) || isNaN(+id) || isEmpty(name) || isEmpty(password)) {
                panic(`invalid host data, id: ${id}, name: ${name}, password: ${password}`)
            }
            hosts[+id] = {id: +id, name: name, password: password}
        })
        return hosts
    })

export const getHostIfValidRegistered = (id: number, password: string) =>
    getHosts().then(hosts => (id in hosts && hosts[id].password === password) ? hosts[id] : undefined)
