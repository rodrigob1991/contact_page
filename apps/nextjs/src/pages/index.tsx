import {PropsStorageClient} from "../classes/PropsStorageClient"
import {HomeProps} from "../types/home"
import PresentationView from "../components/home/presentation/PresentationView"
import StoriesView from "../components/home/stories/StoriesView"
import Header from "../components/home/header/Header"
import Head from "next/head"
import { getStoryBodyJsx } from "../utils/jsx/parsers"

export const HomeRoute = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getHomeProps()

    if (!props) {
        throw new Error("There is not home props in the database")
    }

    // json parser is use to don`t serialize undefined values, Next.js throw an error otherwise.
    return {props: JSON.parse(JSON.stringify(props)) as HomeProps}
}

export default function Home({presentation= {name:"", introduction: "", skills: [], image: undefined}, stories}: HomeProps) {
    const {name, skills} = presentation
    return (
        <>
            <Head>
                <title>{name + " contact page"}</title>
                <link rel="shortcut icon" href="favicon.png"/>
                <meta name="author" content={name}/>
                <meta name="keywords" content={"software developer, programmer, engineer, freelance, " + skills.map(s => s.name).join(" ,")}/>
                <meta name="description" content={"contact page of " + name + " software developer"}/>
            </Head>
                <Header/>
                <PresentationView presentation={presentation}/>
                <StoriesView viewMode="reading" savedStories={stories.map(s => (({body, ...rest}) => ({...rest, body: getStoryBodyJsx(body)}))(s))}/>
        </>
    )
}