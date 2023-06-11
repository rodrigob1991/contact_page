"use client"

import {HomeProps} from "../../types/home"
import {useEffect, useState} from "react"
import {maxWidthSmallestLayout} from "../../dimensions"
import {Footer} from "../../components/home/Layout"
import Header from "../../components/home/header/Header"
import PresentationView from "../../components/home/presentation/PresentationView"
import StoriesView from "../../components/home/stories/StoriesView"

export const HomeRoute = "/"

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

    return  <>
            <Header userName={presentation?.name ?? "none"}/>
            <PresentationView
                presentation={presentation ?? {name: "", introduction: "", skills: [], image: undefined}}/>
            <StoriesView stories={stories}/>
            <Footer>
            </Footer>
            </>
}