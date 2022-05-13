import styled from "@emotion/styled"
import {PrismaClient} from "@prisma/client"
import {FormEvent, useState} from "react"
import {HomeProps} from "../../types/Home"
import path from "path"
import {revalidatePages} from "../api/revalidate/multiple";
import {RevalidationPathId} from "../../types/Revalidation";

export const EDITH_HOME_PATH = path.relative("/pages", "./")

export async function getStaticProps() {
    const prisma = new PrismaClient()
    const homeProps = await prisma.homeProps.findFirst()

    return {props: homeProps}
}

export default function EditHome(props : HomeProps | null){
    const [presentation, setPresentation] = useState(props?.presentation)
    const [stories, setStories] = useState(props?.stories)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        // event.preventDefault()
        const prisma = new PrismaClient()
        const newHomeProps = {presentation: presentation, stories: stories}
        await prisma.homeProps.upsert({where: {id: "homeProps"}, create: newHomeProps, update: newHomeProps})
        const revalidationResponse = await revalidatePages([RevalidationPathId.HOME, RevalidationPathId.EDIT_HOME])
    }

    return (
        <FormContainer onSubmit={handleSubmit}>
            <PresentationInput onChange={(e)=> setPresentation(e.target.value)} />
            <StoryContainer>

            </StoryContainer>
            <Button> UPDATE HOME </Button>

        </FormContainer>
    )

}

const FormContainer = styled.form`
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 50px;
  background-color: #006400;
  gap: 15px;
  height: fit-content;
`
const StoryContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  background-color: #006400;
  gap: 20px;
`
const PresentationInput = styled.input`
    `
const Button = styled.button`
 background-color: #000000;
 color: #FFFFFF;
`