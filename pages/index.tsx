import styled from "@emotion/styled"
import {useState} from "react"
import {HomeComponentProps, StoryComponent} from "../types/Home"
import path from "path"
import {PropsStorageClient} from "../classes/Props"

export const HOME_PATH = "/"

export async function getStaticProps() {
    const propsStorageClient = new PropsStorageClient()
    const homeProps = await propsStorageClient.getHomeProps()

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
    setStoriesWithState((stories) => {
        const updatedStories = [...stories]
        updatedStories.splice(index, 1, story)
        return updatedStories
    })
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
  background-color: #4682B4;
    `
const PresentationName = styled.text`
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
    `
const PresentationIntroduction = styled.text`
  font-weight: bold;
  font-size: 18px;
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  gap: 20px;
  background-color: #F5F5F5;
  align-items: center;
    `
const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  gap: 20px;
  background-color: #F5F5F5
  width: fit-content;
    `
const StoryBody = styled.text`
  color: #000000;
  font-size: 20px;
  font-family: "Lucida Console", "Courier New", monospace;
`
const StoryTitle = styled.text`
  font-size: 25px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  cursor: pointer;
  width: fit-content;
  background-color: #F5F5F5;
`
const StoryOpenView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`