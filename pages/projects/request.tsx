import styled from "@emotion/styled"
import {useState} from "react";

type Story = {
    title: string
    body: string
}

type Props = {
    presentation: string
    stories: Story[]
}

export default function Home({presentation, stories}: Props) {
    const [storiesWithState, setStoriesWithState] = useState(stories.map((story) => {
        return {story: story, isOpen: false}
    }))

    const openOrCloseStory = (index: number) => {
        const story = {...storiesWithState[index]}
        story.isOpen = !story.isOpen
        setStoriesWithState((stories) => stories.splice(index, 0, story))
    }

    const getStoryView = (story: Story, isOpen: boolean) => {
        const storyTitle = <StoryTitle>{story.title}</StoryTitle>
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
                {presentation}
            </Presentation>
            <StoryContainer>
                {storiesWithState.map((story, index) => getStoryView(story, true))}
            </StoryContainer>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
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