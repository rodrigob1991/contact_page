import {getHosts} from "../../../user_types/host/authentication"

test("host authentication", async () => {
    const hosts = await getHosts()
    expect(hosts).toHaveProperty("1")
})
