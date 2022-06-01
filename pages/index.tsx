import styled from "@emotion/styled"
import {useState} from "react"
import {HomeComponentProps, StoryComponent} from "../types/Home"
import path from "path"
import {PropsStorageClient} from "../classes/Props"

export const HOME_PATH = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()
    console.table(homeProps)

    if (!homeProps) {
        throw new Error("There is not home props in the database")
    }

    return {props: homeProps}
}

export default function Home({presentation, stories}: HomeComponentProps) {
  const [storiesWithState, setStoriesWithState] = useState(stories.map((story) => {
    return {story: story, isOpen: false}
  }))

  const openOrCloseStory = (index: number) => {
    const story = {...storiesWithState[index]}
    story.isOpen = !story.isOpen
    setStoriesWithState((stories) => stories.splice(index, 0, story))
  }

  const getStoryView = (story: StoryComponent, index: number, isOpen: boolean) => {
    const storyTitle = <StoryTitle onClick={(e => openOrCloseStory(index))}>{story.title}</StoryTitle>
    return (
        isOpen ?
            <StoryOpenView>
              {storyTitle}
              <StoryBody>
                {story.body}
              </StoryBody>
            </StoryOpenView>
            :
            storyTitle
    )
  }
  return (
      <Container>
          <PresentationContainer>
              <PresentationName>
                  {presentation?.name}
              </PresentationName>
              <PresentationIntroduction>
                  {presentation?.introduction}
              </PresentationIntroduction>

          </PresentationContainer>

        <StoryContainer>
          {storiesWithState.map(({story, isOpen}, index) => getStoryView(story, index, isOpen))}
        </StoryContainer>
      </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 10px;
  background-color: #FF8C00
    `
const PresentationName = styled.text`
    `
const PresentationIntroduction = styled.text`
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  gap: 20px;
  background-color: #FF8C00
    `
const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  gap: 20px;
  background-color: #FF8C00
    `
const StoryBody = styled.text`
  color: #000000;
  font-size: 20px;
  font-family: "Lucida Console", "Courier New", monospace;
`
const StoryTitle = styled.title`
  color: #000000;
  font-size: 40px;
  text-decoration-line: underline;
  font-family: Arial, Helvetica, sans-serif;
`
const StoryOpenView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`