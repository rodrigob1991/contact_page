import {isEmpty} from "utils/src/strings"
import {Host} from "chat-common/src/model/types"
import {emptyHost} from "chat-common/src/model/constants"
import fs from "fs"
import path from "path"

// change this implementation for a decent authentication

type HostsJsonFile = { [k: number]: Host}

export const getHosts = () => {
    let hosts: HostsJsonFile = {}
    const filePath = path.join(__dirname, "hosts.json")
    fs.readFile(filePath, 'utf8', (error, hostsJson) => {
        if (error) {
            throw new Error("error reading host json file")
        } else if (isEmpty(hostsJson)) {
            throw new Error("must exist at least one registered host")
        } else {
            hosts = JSON.parse(hostsJson)
        }
    })

    for (const hostId in hosts) {
        if (isNaN(+hostId)) {
            throw new Error("the key: " + hostId + " in hosts json file is not a number")
        }
        const host = hosts[hostId]
        for (const key in emptyHost) {
            if (!(key in host) || typeof host[key as keyof Host] !== typeof emptyHost[key as keyof Host]) {
                throw new Error("invalid host object in hosts json file: " + JSON.stringify(host))
            }
        }
    }

    return hosts
}

export const isHostValidRegistered = (id: number, password: string) => {
    const host = getHosts()[id]
    return host !== undefined && host.password === password
}