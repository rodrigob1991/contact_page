import styled from "@emotion/styled"
import {MdForwardToInbox} from "react-icons/md"
import {useFormModal} from "../../FormComponents"
import ComponentWithTooltip from "../../ComponentWithTooltip"
import Image from "next/image"
import {useState} from "react";

type Props = {
}
export default function Messenger(){
    const [liveChat, setLiveChat] = useState(false)

    const sendEmail = ({from, subject, message}: { from: string, subject: string, message: string }) => {
        const bodyParams = {
            sender: {email: from},
            to: [{email: process.env.NEXT_PUBLIC_MY_EMAIL, name: "Rodrigo"}],
            subject: subject,
            htmlContent: `<!DOCTYPE html><html><body>${message}</body> </html>`
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
            {liveChat ? <ComponentWithTooltip childElement={<Image className={"messengerIcon"} alt={""} src="/online.svg" width="80" height="50"/>}
                            tooltipText={"ask me"} tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40} tooltipLeftDeviation={-100}/>
                      : <ComponentWithTooltip childElement={<Image className={"messengerIcon"} alt={""} src="/offline.svg" width="80" height="50"/>}
                            tooltipText={"you can send an email"} tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40} tooltipLeftDeviation={-100}/>}
            <ComponentWithTooltip childElement={<MdForwardToInbox className={"messengerIcon"} style={{cursor: "pointer", color: "#DAA520"}} onClick={(e) => showSendMessageModal()}/>}
                                  tooltipText={"send email"} tooltipStyle={{height: "35px", width: "fit-content"}} tooltipTopDeviation={-40} tooltipLeftDeviation={-100}/>
        </Container>
    )
}

const Container = styled.div`
  position: relative;
  right: 0px;
  display: flex;
  flex-direction: row;
  gap: 40px;
  padding-right: 30px;
  align-items: center;
    `