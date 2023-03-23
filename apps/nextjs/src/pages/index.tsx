import {PropsStorageClient} from "../classes/PropsStorageClient"
import {HomeProps} from "../types/home"
import PresentationView from "../components/home/presentation/PresentationView"
import StoriesView from "../components/home/stories/StoriesView"
import {Container, Footer} from "../components/home/Layout"
import Header from "../components/home/header/Header"
import {useEffect, useState} from "react"
import {maxWidthSmallestLayout} from "../Dimensions"
import Head from "next/head"
import {getStoryBodyJsx} from "../utils/Parsers"

export const HomeRoute = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const props = await propsStorageClient.getHomeProps()

    if (!props) {
        throw new Error("There is not home props in the database")
    }

    // json parser is use to don`t serialize undefined values, Next.js throw an error otherwise.
    return {props: JSON.parse(JSON.stringify(props))}
}

export default function Home({presentation, stories}: HomeProps) {
    const [showSidebar, setShowSidebar] = useState(false)
    const showOrHideSidebar = () => { setShowSidebar(window.innerWidth > maxWidthSmallestLayout) }
    useEffect(() => {
        showOrHideSidebar()
        const handleWindowResize = () => {
            showOrHideSidebar()
        }
        window.addEventListener('resize', handleWindowResize)

        return () => { window.removeEventListener('resize', handleWindowResize) }
    }, [])

  return (
      <>
      <Head>
          <title>{presentation?.name}</title>
          <link rel="shortcut icon" href="favicon.png" />
      </Head>
      <Container>
          <Header/>
          <PresentationView presentation={presentation || {name:"", introduction: "", skills: [], image: undefined}}/>
          <StoriesView stories={stories.map(s=> {return {...(({body, ...rest})=> rest)(s),body:getStoryBodyJsx(s.body)}})}/>
          <Footer>
          </Footer>
      </Container>
      </>
  )
}