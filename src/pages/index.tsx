import styled from "@emotion/styled"
import {PropsStorageClient} from "../classes/PropsStorageClient"
import {MdForwardToInbox} from "react-icons/md"
import Image from "next/image"
import Link from "next/link"
import {useFormModal} from "../components/FormComponents"
import {HomeProps} from "../types/Home"
import PresentationView from "../components/home/presentation/PresentationView"
import StoriesView from "../components/home/stories/StoriesView"
import {Container, Footer} from "../components/home/Layout"
import Sidebar from "../components/home/Sidebar";
import Header from "../components/home/Header";

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
  return (
      <Container>
          <Sidebar/>
          <Header/>
          <PresentationView presentation={presentation || {name:"", introduction: "", skills: [], image: undefined}}/>
          <StoriesView stories={stories}/>
          <Footer>
          </Footer>
      </Container>
  )
}