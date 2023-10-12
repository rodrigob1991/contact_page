import {defineConfig} from "@yarnpkg/types"

module.exports = defineConfig({
    async constraints({Yarn}) {
        for (const dep of Yarn.dependencies({ident: "typescript"})) {
            dep.update("^5.2.2")
        }
        for (const dep of Yarn.dependencies({ident: "eslint"})) {
            dep.update("^8.48.0")
        }
        for (const dep of Yarn.dependencies({ident: "jest"})) {
            dep.update("^29.7.0")
        }
    }
})
