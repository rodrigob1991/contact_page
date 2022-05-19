import styled from "@emotion/styled"
import {useState} from "react"
import {PrismaClient} from "@prisma/client"
import {HomeComponentProps, HomeProps, Story} from "../types/Home"
import path from "path"

export const HOME_PATH = path.relative("/pages", "./")

export const HOME_PROPS_ID = "homeProps"

export async function getStaticProps() {
    const prisma = new PrismaClient()

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

  const getStoryView = (story: Story, index: number, isOpen: boolean) => {
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
        <Presentation>
          {presentation?.introduction}
        </Presentation>
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
const Presentation = styled.text`
  color: #FF8C00
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