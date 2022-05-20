import styled from "@emotion/styled"
import {useState} from "react"
import {HomeComponentProps, StoryComponent} from "../../types/Home"
import path from "path"
import {revalidatePages} from "../api/revalidate/multiple"
import {RevalidationPathId} from "../../types/Revalidation"
import {propsClient} from "../../classes/Props"

export const EDITH_HOME_PATH = path.relative("/pages", "./")

export async function getStaticProps() {
    const homeProps = await propsClient.getHomeProps()

    return {props: homeProps}
}

export default function EditHome(props : HomeComponentProps | null){
    const [namePresentation, setNamePresentation] = useState(props?.presentation?.name)
    const [introductionPresentation, setIntroductionPresentation] = useState(props?.presentation?.introduction)

    const [stories, setStories] = useState(props?.stories)
    const [selectedStory, setSelectedStory] = useState<StoryComponent>({title: "", body: ""})

    const [revalidationMessage, setRevalidationMessage] = useState("")

    const revalidateHome = async () => {
        try {
            const revalidationsResponse = await revalidatePages([RevalidationPathId.HOME, RevalidationPathId.EDIT_HOME])
            if (revalidationsResponse.httpCode >= 400) {
                setRevalidationMessage(revalidationsResponse.errorMessage || "there must be always an error message")
            } else {
                const revalidations = revalidationsResponse.revalidations
                //there must always be revalidations here
                if (revalidations) {
                    const message = revalidations.map(r => r.pathId + ":" + r.message).toString()
                    setRevalidationMessage(message)
                }
            }
        } catch (e) {
            setRevalidationMessage("could not revalidate the home")
            console.error(e)
        }
    }

    return (
        <Container>
            <PresentationForm>
                <TextInput type={"text"} onChange={(e)=> setNamePresentation(e.target.value)}/>
                <TextInput type={"text"} onChange={(e)=> setIntroductionPresentation(e.target.value)}/>
                <Button type={"submit"}> SAVE PRESENTATION </Button>
            </PresentationForm>
            <StoryContainer>
                <EditStoryForm>
                    <EditStoryDataContainer>
                        <TextInput type={"text"} onChange={(e) => setNamePresentation(e.target.value)}/>
                        <TextInput type={"text"} onChange={(e) => setNamePresentation(e.target.value)}/>
                    </EditStoryDataContainer>
                    <Button type={"submit"}> {selectedStory.id ? "UPDATE" : "CREATE"} </Button>
                </EditStoryForm>
                <StoryTable>
                    {sto}
                </StoryTable>

            </StoryContainer>
            <Button onClick={revalidateHome}> REVALIDATE HOME </Button>
            {revalidationMessage}
        </Container>
    )
}

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 50px;
  background-color: #006400;
  gap: 15px;
  height: fit-content;
`
const PresentationForm = styled.form`
  align-items: left;
  display: flex;
  flex-direction: column;
  background-color: #006400;
  gap: 20px;
`
const TextInput = styled.input`
    `
const StoryContainer = styled.div`
  align-items: left;
  display: flex;
  flex-direction: column;
  background-color: #006400;
  gap: 20px;
`
const EditStoryForm = styled.form`
  align-items: center;
  display: flex;
  flex-direction: row;
  background-color:;
  gap: 15px;
`
const EditStoryDataContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color:;
  gap: 15px;
`
const StoryTable = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color:;
  gap: 5px;
`
const StoryRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 5px;
`
const Button = styled.button`
 background-color: #000000;
 color: #FFFFFF;
`