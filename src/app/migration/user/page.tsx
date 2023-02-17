import {PropsStorageClient} from "../../../classes/PropsStorageClient"
import EditHome from "./EditHome"
import {HomeProps} from "../../../types/Home";

export const metadata = {
    title: "yo",
    /* icons: {
         icon: "/icon.png"
     }*/
}

export async function generateMetadata() {
    //fetch and return the data
}

export const dynamic = "force-dynamic"

async function getEditHomeProps() {
    const propsStorageClient = new PropsStorageClient()
    return propsStorageClient.getEditHomeProps()
}

export default async function Page() {
    const props = await getEditHomeProps()
    return <EditHome {...props}/>
}
