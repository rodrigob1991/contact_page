"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHostIfValidRegistered = exports.getHosts = void 0;
const strings_1 = require("utils/src/strings");
const files_1 = require("utils/src/files");
const app_1 = require("../../app");
const getHosts = () => (0, files_1.getSplitFileContent)("hosts", [",", ":"]).then(hostsData => {
    const hosts = {};
    hostsData.forEach(hostData => {
        const id = hostData[0];
        const name = hostData[1];
        const password = hostData[2];
        if ((0, strings_1.isEmpty)(id) || isNaN(+id) || (0, strings_1.isEmpty)(name) || (0, strings_1.isEmpty)(password)) {
            (0, app_1.panic)(`invalid host data, id: ${id}, name: ${name}, password: ${password}`);
        }
        hosts[+id] = { id: +id, name: name, password: password };
    });
    return hosts;
});
exports.getHosts = getHosts;
const getHostIfValidRegistered = (id, password) => (0, exports.getHosts)().then(hosts => (id in hosts && hosts[id].password === password) ? hosts[id] : undefined);
exports.getHostIfValidRegistered = getHostIfValidRegistered;
