import Home from './Home'
import {PropsStorageClient} from "../../classes/PropsStorageClient"

/*export const metadata = {
    title: "rodrigo benoit",
    /!* icons: {
         icon: "/icon.png"
     }*!/
}*/
/*export async function generateMetadata() {
    //fetch and return the data
}*/

//export const dynamic = "force-static"

const getHomeProps = async () => {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getHomeProps()
    if (!props) {
        throw new Error("There is not home props in the database")
    }
    return props
}

export default async function Page() {
    const props = await getHomeProps()

    return <Home {...props}/>
}
