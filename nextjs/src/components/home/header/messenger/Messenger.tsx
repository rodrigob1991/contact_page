import styled from "@emotion/styled"
import {MdForwardToInbox} from "react-icons/md"
import {useFormModal} from "../../../FormComponents"
import ComponentWithTooltip from "../../../ComponentWithTooltip"
import {maxWidthSmallestLayout} from "../../../../Dimensions"
import LiveChat from "./LiveChat"

type Props = {
}
export default function Messenger(){

    const sendEmail = ({from, subject, message}: { from: string, subject: string, message: string }) => {
        const bodyParams = {
            sender: {email: from},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
            subject: subject,
            htmlContent: `<!DOCTYPE html><html><body>${message}</body></html>`
        }
        const succeedResultMessage = {succeed: true, message: "email sent"}
        const unsucceedResultMessage = {succeed: false, message: "email was not sent"}
        const logError = (error: any) => {
            console.error(`Error sending the email: ${JSON.stringify(error)}`)
        }
        return fetch(process.env.NEXT_PUBLIC_SENDINBLUE_URL as string, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.NEXT_PUBLIC_SENDINBLUE_API_KEY as string
            },
            body: JSON.stringify(bodyParams),
        }).then((response) => {
                let nextThenArg
                if (response.ok) {
                    nextThenArg = "ok"
                } else {
                    nextThenArg = response.json()
                }
                return nextThenArg
            }
        ).then((resultMessageOrBody) => {
            let resultMessage
            if (resultMessageOrBody === "ok") {
                resultMessage = succeedResultMessage
            } else {
                resultMessage = unsucceedResultMessage
                logError(resultMessageOrBody)
            }
            return resultMessage
        }).catch((e) => {
            logError(e)
            return unsucceedResultMessage
        })
    }

    const [showSendMessageModal, SendMessageModal] = useFormModal(
        {
            inputElementsProps: {
                from: {type: "textInputEmail", required: true, placeholder: "from", width: 300, style:{ fontSize: "2rem"}},
                subject: {type: "textInput", placeholder: "subject", width: 300, style:{ fontSize: "2rem"}},
                message: {type: "textAreaInput", required: true, placeholder: "message", height: 250, width: 300, style:{ fontSize: "2rem"}}
            },
            processSubmission : sendEmail,
            position: {left: 50, top: 40},
            resultMessageStyle: {fontStyle: "2rem"},
            button: {text: "SEND EMAIL", style: {fontSize: "1.7rem"}}
        })

    return (
        <Container>
            {SendMessageModal}
            <LiveChat/>
            <ComponentWithTooltip childElement={<SendEmailImage onClick={(e) => showSendMessageModal()}/>}
                                  tooltipText={"send email"} tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40} tooltipLeftDeviation={-100}/>
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  align-items: center;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    gap: 15px;
  }
    `
const SendEmailImage = styled(MdForwardToInbox)`
  width: 70px;
  height:70px;
  color: white;
  cursor: pointer;
   @media (max-width: ${maxWidthSmallestLayout}px) {
    width: 40px;
    height: 40px;
  }
    `