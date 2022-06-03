import styled from "@emotion/styled"
import {useState} from "react"
import {HomeComponentProps, StoryComponent} from "../types/Home"
import {PropsStorageClient} from "../classes/Props"
import {BsChevronDoubleDown, BsChevronDoubleUp} from "react-icons/bs"

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
        const storyTitle =
            <StoryTitleView onClick={(e => openOrCloseStory(index))}>
                <StoryTitle>{story.title}</StoryTitle>
                {isOpen ? <BsChevronDoubleUp/> : <BsChevronDoubleDown/>}
            </StoryTitleView>
    return (
        <StoryView>{
            isOpen ?
                <StoryOpenView>
                    {storyTitle}
                    <StoryBody>
                        {story.body}
                    </StoryBody>
                </StoryOpenView>
                :
                storyTitle
        }
        </StoryView>
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
            <StoryContainerTitle>STORIES</StoryContainerTitle>
          {storiesWithState.map(({story, isOpen}, index) => getStoryView(story, index, isOpen))}
        </StoryContainer>
          <FooterContainer>

          </FooterContainer>
      </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
    `
const PresentationName = styled.text`
  color: #FFFFFF;
  text-decoration-color: #FFFFFF;
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationIntroduction = styled.text`
  font-weight: bold;
  font-size: 18px;
  background-color: #778899;
  padding: 7px;
  border-radius: 15px;
  color: #FFFFFF;
  text-shadow: 2px 2px 5px #000000;
    `
const PresentationContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 20px;
  background-image: linear-gradient(#00008B,#87CEFA);
  align-items: center;
  box-shadow: 5px 10px #888888;
    `
const StoryContainerTitle = styled.text`
  color: #FFFFFF;
  text-decoration-style: solid;
  text-shadow: 2px 2px 5px #000000;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 20px;
  border-radius: 15px;
  background-color: #778899;
  width: fit-content;
  padding: 5px;
  `
const StoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 90px;
  gap: 5px;
  background-color: #00008B;
  padding-top: 15px;
  padding-bottom: 15px;
    `
const StoryView = styled.div`
  padding: 15px;
`
const StoryBody = styled.text`
  color: #FFD700;
  font-size: 22px;
  font-weight: bold;
  font-family: "Lucida Console", "Courier New", monospace;
  border-style: solid;
  border-color: #778899;
  padding: 10px;
  border-radius: 5px;
`
const StoryTitleView = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  gap: 15px;
  color: #FFFFFF;
  font-size: 25px;
  cursor: pointer;
`
const StoryTitle = styled.text`
  font-size: 25px;
  font-weight: bold;
  font-family: Arial, Helvetica, sans-serif;
  width: fit-content;
  text-shadow: 2px 2px 5px #000000;
`
const StoryOpenView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 15px;
`
const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #87CEFA;
  align-items: center;
  align-self: flex-start;
  height: 100%;
  width: 100%;
    `